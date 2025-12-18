# rag_core.py
# Strict numeric-fidelity RAG pipeline module
# EDIT PATHS at top as needed (left as placeholders)

import os, json, re, time
from pathlib import Path
from typing import List, Dict, Tuple, Optional

import nltk
nltk.download("punkt", quiet=True)
from nltk.tokenize import sent_tokenize

import torch
from transformers import pipeline, GPT2TokenizerFast
from sentence_transformers import CrossEncoder
from langchain_community.docstore.document import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# PDF extraction
import fitz  # PyMuPDF

# ---------------- CONFIG (EDIT THESE PATHS) ----------------
PDF_INPUT_DIR = "/content/drive/MyDrive/agriculture corpora/New folder"
PROCESSED_TXT_DIR = "/content/drive/MyDrive/processed_texts"
CHUNKS_JSONL = "/content/drive/MyDrive/processed/chunks_semantic.jsonl"
FAISS_INDEX_DIR = "/content/drive/MyDrive/faiss_agriculture_index"


EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
RERANK_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
QA_MODEL = "deepset/roberta-base-squad2"

CHUNK_SIZE = 400
MIN_CHUNK = 80
TOP_K = 20
RERANK_TOP = 6

DEVICE = 0 if torch.cuda.is_available() else -1
tokenizer = GPT2TokenizerFast.from_pretrained("gpt2")

# ---------------- Utilities ----------------
def normalize_text(t: str) -> str:
    return re.sub(r"\s+", " ", t).strip()

def token_len(t: str) -> int:
    return len(tokenizer.encode(t, add_special_tokens=False))

def safe_source(doc: Document) -> str:
    md = getattr(doc, "metadata", {}) or {}
    for k in ("source","source_file","filename"):
        if k in md and md[k]:
            return str(md[k])
    return "Unknown"

# ---------------- PDF -> TXT ----------------
def extract_pdfs_to_txt(pdf_dir: str = PDF_INPUT_DIR, out_dir: str = PROCESSED_TXT_DIR):
    os.makedirs(out_dir, exist_ok=True)
    pdfs = list(Path(pdf_dir).glob("*.pdf"))
    if not pdfs:
        raise FileNotFoundError(f"No PDFs found in {pdf_dir}")
    print(f"Extracting {len(pdfs)} PDFs to {out_dir} ...")
    for pdf in pdfs:
        try:
            doc = fitz.open(pdf)
            pages = []
            for p in doc:
                t = p.get_text()
                if t and t.strip():
                    pages.append(t)
            doc.close()
            if pages:
                txt = normalize_text(" ".join(pages))
                out_path = Path(out_dir) / f"{pdf.stem}.txt"
                with open(out_path, "w", encoding="utf-8") as f:
                    f.write(txt)
        except Exception as e:
            print("Failed to extract", pdf, e)
    print("PDF extraction done.")

# ---------------- Chunking ----------------
def chunk_text(text: str) -> List[str]:
    sents = sent_tokenize(text)
    chunks, buf, buf_tok = [], [], 0
    for s in sents:
        s = s.strip()
        if not s:
            continue
        st = token_len(s)
        if buf_tok + st > CHUNK_SIZE:
            if buf_tok >= MIN_CHUNK:
                chunks.append(" ".join(buf))
            buf = buf[-2:]
            buf_tok = sum(token_len(x) for x in buf)
        buf.append(s)
        buf_tok += st
    if buf_tok >= MIN_CHUNK and buf:
        chunks.append(" ".join(buf))
    return chunks

def chunk_all_texts(input_dir: str = PROCESSED_TXT_DIR, out_jsonl: str = CHUNKS_JSONL):
    os.makedirs(os.path.dirname(out_jsonl), exist_ok=True)
    txts = list(Path(input_dir).glob("*.txt"))
    if not txts:
        raise FileNotFoundError(f"No .txt files in {input_dir} (run PDF extraction).")
    total = 0
    with open(out_jsonl, "w", encoding="utf-8") as fout:
        for t in txts:
            text = normalize_text(open(t, encoding="utf-8").read())
            for i,ch in enumerate(chunk_text(text)):
                fout.write(json.dumps({"id": f"{t.name}__{i}", "text": ch, "metadata": {"source": t.name}} , ensure_ascii=False) + "\n")
                total += 1
    print(f"Chunking complete: {total} chunks -> {out_jsonl}")
    return total

# ---------------- FAISS ----------------
def build_faiss_index(chunks_jsonl: str = CHUNKS_JSONL, index_dir: str = FAISS_INDEX_DIR):
    docs = []
    with open(chunks_jsonl, "r", encoding="utf-8") as fin:
        for line in fin:
            j = json.loads(line)
            text = j.get("text","").strip()
            if not text:
                continue
            md = j.get("metadata", {})
            docs.append(Document(page_content=text, metadata=md))
    if not docs:
        raise ValueError("No documents to index.")
    emb = HuggingFaceEmbeddings(model_name=EMBED_MODEL, encode_kwargs={"normalize_embeddings": True})
    vs = FAISS.from_documents(docs, emb)
    os.makedirs(index_dir, exist_ok=True)
    vs.save_local(index_dir)
    print("FAISS built.")
    return vs

def load_faiss_index(index_dir: str = FAISS_INDEX_DIR):
    emb = HuggingFaceEmbeddings(model_name=EMBED_MODEL, encode_kwargs={"normalize_embeddings": True})
    vs = FAISS.load_local(index_dir, emb, allow_dangerous_deserialization=True)
    print("FAISS loaded.")
    return vs

# ---------------- Models init ----------------
reranker = None
qa_pipeline = None

def init_models(rerank_model=RERANK_MODEL, qa_model=QA_MODEL):
    global reranker, qa_pipeline
    try:
        reranker = CrossEncoder(rerank_model, device=DEVICE if DEVICE >= 0 else -1)
        print("Reranker loaded.")
    except Exception as e:
        print("Reranker init failed:", e); reranker = None
    try:
        qa_pipeline = pipeline("question-answering", model=qa_model, device=DEVICE if DEVICE >= 0 else -1, handle_impossible_answer=True)
        print("QA pipeline loaded.")
    except Exception as e:
        print("QA init failed:", e); qa_pipeline = None

# ---------------- Query classifier ----------------
def classify_query(q: str) -> Dict[str,bool]:
    ql = q.lower()
    return {
        "asks_crops": bool(re.search(r"\b(rabi|winter).*(crop|crops)|which.*crop", ql)),
        "mentions_rainfed": bool(re.search(r"rain[\- ]?fed", ql)),
        "asks_yield": bool(re.search(r"yield|improv|increase|productiv", ql)),
        "asks_apple": "apple" in ql,
        "asks_trend": bool(re.search(r"two decades|20 years|last 20|last two decades|over the last", ql)),
        "asks_temp": bool(re.search(r"temperature|°c|celsius", ql)),
        "asks_rain": bool(re.search(r"rainfall|mm|monthly|annual", ql)),
        "asks_smallholders": bool(re.search(r"small landholder|smallholder|marginal|small holder", ql)),
        "asks_schemes": bool(re.search(r"scheme|program|nfs|nabard|pmksy|nfsm|rkv", ql)),
        "asks_roles": bool(re.search(r"what role|role can|uses can", ql))
    }

# ---------------- Retrieval + rerank ----------------
def expand_query(query: str, cls: Dict[str,bool]) -> str:
    extras = []
    if cls.get("mentions_rainfed"):
        extras += ["rainfed", "rain-fed", "rain fed"]
    if cls.get("asks_crops"):
        extras += ["rabi","winter","wheat","mustard","barley","pea","lentil"]
    if cls.get("asks_yield"):
        extras += ["yield","increase","q/ha","t/ha","%"]
    if cls.get("asks_apple"):
        extras += ["apple","temperature","rainfall","chill"]
    if not ("uttarakhand" in query.lower()):
        extras.append("Uttarakhand")
    return query + " " + " ".join(sorted(set(extras)))

def retrieve_and_rerank(query: str, vs, cls: Dict[str,bool]) -> List[Tuple[Document,float]]:
    expanded = expand_query(query, cls)
    try:
        candidates = vs.similarity_search(expanded, k=TOP_K)
    except Exception:
        candidates = vs.similarity_search(query, k=TOP_K)
    if not candidates:
        return []
    if reranker is None:
        return [(d,1.0) for d in candidates[:RERANK_TOP]]
    pairs = [[query, d.page_content] for d in candidates]
    scores = reranker.predict(pairs, show_progress_bar=False)
    doc_scores = [(d,float(s)) for d,s in zip(candidates, scores)]
    doc_scores.sort(key=lambda x: x[1], reverse=True)
    return doc_scores[:RERANK_TOP]

# ---------------- Context number scanning (with sentence evidence) ----------------
_re_percent = re.compile(r"(\d{1,3}(?:\.\d+)?\s*%)")
_re_npk_colon = re.compile(r"\b\d{1,3}\s*:\s*\d{1,3}\s*:\s*\d{1,3}\b")
_re_npk_npk = re.compile(r"\bN\s*\d{1,3}.*P.*\d{1,3}.*K.*\d{1,3}", flags=re.I)
_re_temp_range = re.compile(r"(-?\d{1,2}\s*(?:to|-|–)\s*-?\d{1,2})\s*°?C", flags=re.I)
_re_single_temp = re.compile(r"(-?\d{1,2})\s*°?C\b", flags=re.I)
_re_rain_range = re.compile(r"(\d{2,4}\s*(?:to|-|–)\s*\d{2,4})\s*mm", flags=re.I)
_re_rain_single = re.compile(r"(\d{2,4})\s*mm(?:/yr|/year| per year)?", flags=re.I)
_re_yield_qha = re.compile(r"(\d{1,4}(?:\.\d+)?\s*(?:q/ha|t/ha|q per ha|t per ha))", flags=re.I)
_re_yield_increase = re.compile(r"(increase(?:d)?\s*(?:by)?\s*(\d{1,3}(?:\.\d+)?\s*%))", flags=re.I)

def sentence_containing(term: str, context: str) -> str:
    sents = sent_tokenize(context)
    for s in sents:
        if re.search(re.escape(term), s, flags=re.I):
            return s.strip()
    return sents[0].strip() if sents else context.strip()

def scan_numbers_with_evidence(context: str) -> List[Dict]:
    found = []
    ctx = context
    for m in _re_percent.findall(ctx):
        sent = sentence_containing(m, ctx)
        label = 'unqualified'
        if re.search(r"yield|increase|improv", sent, flags=re.I):
            label = 'yield_increase'
        elif re.search(r"area|coverage|percent|% of", sent, flags=re.I):
            label = 'percentage'
        found.append({"raw": m, "label": label, "evidence": sent})
    for m in _re_npk_colon.findall(ctx):
        sent = sentence_containing(m, ctx)
        found.append({"raw": m, "label": "npk_ratio", "evidence": sent})
    for m in _re_npk_npk.findall(ctx):
        sent = sentence_containing(m, ctx)
        found.append({"raw": m, "label": "npk_ratio", "evidence": sent})
    for m in _re_temp_range.findall(ctx):
        sent = sentence_containing(m, ctx)
        found.append({"raw": m + " °C", "label": "temperature_c", "evidence": sent})
    for m in _re_single_temp.findall(ctx):
        sent = sentence_containing(m, ctx)
        found.append({"raw": m + " °C", "label": "temperature_c", "evidence": sent})
    for m in _re_rain_range.findall(ctx):
        sent = sentence_containing(m, ctx)
        found.append({"raw": m + " mm", "label": "rainfall_mm", "evidence": sent})
    for m in _re_rain_single.findall(ctx):
        sent = sentence_containing(m, ctx)
        found.append({"raw": m + " mm", "label": "rainfall_mm", "evidence": sent})
    for m in _re_yield_qha.findall(ctx):
        sent = sentence_containing(m, ctx)
        found.append({"raw": m, "label": "yield_amount", "evidence": sent})
    for m in _re_yield_increase.findall(ctx):
        sent = sentence_containing(m[0], ctx)
        raw = m[1]
        found.append({"raw": raw, "label": "yield_increase", "evidence": sent})
    unique = []
    seen = set()
    for item in found:
        if item["raw"] not in seen:
            unique.append(item)
            seen.add(item["raw"])
    return unique

# ---------------- Extract from candidate docs ----------------
def qa_extract_with_context(query: str, doc: Document) -> Optional[Dict]:
    try:
        res = qa_pipeline(question=query, context=doc.page_content, max_answer_len=120, handle_impossible_answer=True)
    except Exception:
        return None
    ans = (res.get("answer") or "").strip()
    score = float(res.get("score") or 0.0)
    numbers = scan_numbers_with_evidence(doc.page_content)
    if ans and (score > 0.05 or any(n for n in numbers)):
        return {"answer": ans, "score": score, "context": doc.page_content, "source": safe_source(doc), "numbers": numbers}
    return None

def extract_from_candidates(query: str, candidates: List[Tuple[Document,float]]) -> List[Dict]:
    out = []
    for doc, rscore in candidates:
        ex = qa_extract_with_context(query, doc)
        if ex:
            ex["rerank_score"] = float(rscore)
            out.append(ex)
    out.sort(key=lambda x: (1 if x.get("answer") else 0, x.get("score",0), x.get("rerank_score",0)), reverse=True)
    return out

# ---------------- Synthesis (with explicit numeric qualification) ----------------
def synthesize_answer(query: str, cls: Dict[str,bool], extracted: List[Dict]) -> str:
    q = query.lower()
    aggregated_numbers = []
    for ex in extracted:
        for n in ex.get("numbers", []):
            aggregated_numbers.append({"raw": n["raw"], "label": n["label"], "evidence": n["evidence"], "source": ex.get("source")})
    def pick_by_label(lbl):
        return [n for n in aggregated_numbers if n["label"] == lbl]

    if cls.get("asks_crops") and cls.get("mentions_rainfed") and cls.get("asks_yield"):
        crops = set()
        for ex in extracted:
            txt = (ex.get("answer","") + " " + ex.get("context","")).lower()
            for m in re.findall(r"\b(wheat|barley|mustard|lentil|pea|gram|chickpea|maize|millet)\b", txt):
                crops.add(m.capitalize())
        y_increases = pick_by_label("yield_increase")
        y_amounts = pick_by_label("yield_amount")
        out_lines = []
        if crops:
            out_lines.append("Suitable Rabi crops for rainfed regions (from sources):")
            for c in sorted(crops):
                out_lines.append(f"- {c}")
        else:
            out_lines.append("Sources mention Rabi cropping but do not list rainfed-specific crops clearly.")
        if y_increases or y_amounts:
            out_lines.append("\nReported yield evidence (verbatim, with qualification):")
            for n in y_increases:
                out_lines.append(f"- {n['raw']} — described in context: \"{n['evidence']}\" (source: {n['source']})")
            for n in y_amounts:
                out_lines.append(f"- {n['raw']} — described in context: \"{n['evidence']}\" (source: {n['source']})")
        else:
            percents = pick_by_label("percentage")
            if percents:
                out_lines.append("\nNumeric percentages were found, but the sources did not clearly state whether these refer to yield improvements. Examples:")
                for n in percents:
                    out_lines.append(f"- {n['raw']} — context: \"{n['evidence']}\" (source: {n['source']})")
                out_lines.append("Cannot assert what these percentages refer to without clearer context.")
            else:
                out_lines.append("\nNo explicit quantitative yield-improvement figures for improved seed varieties were found in the retrieved sources. Some sources mention qualitative 'increased yield' statements without numbers.")
        return "\n".join(out_lines)

    if cls.get("asks_apple") and (cls.get("asks_temp") or cls.get("asks_rain") or cls.get("asks_trend")):
        temps = pick_by_label("temperature_c")
        rains = pick_by_label("rainfall_mm")
        out = []
        if temps:
            out.append("Temperature ranges mentioned (verbatim) and their context/evidence:")
            for n in temps:
                out.append(f"- {n['raw']} — context: \"{n['evidence']}\" (source: {n['source']})")
        else:
            out.append("No explicit temperature ranges for apple cultivation were found in the retrieved sources.")
        if rains:
            out.append("\nRainfall ranges/figures mentioned (verbatim) and evidence:")
            for n in rains:
                out.append(f"- {n['raw']} — context: \"{n['evidence']}\" (source: {n['source']})")
        else:
            out.append("\nNo explicit rainfall ranges for apple cultivation were found in the retrieved sources.")
        trend_phrases = []
        for ex in extracted:
            if re.search(r"two decades|20 years|last 20|in the last twenty", ex.get("context",""), flags=re.I):
                for sent in sent_tokenize(ex.get("context","")):
                    if re.search(r"two decades|20 years|last 20|in the last twenty", sent, flags=re.I):
                        trend_phrases.append((sent.strip(), ex.get("source")))
        if trend_phrases:
            out.append("\nStatements about multi-decade changes (verbatim):")
            for sent, src in trend_phrases:
                out.append(f"- \"{sent}\" (source: {src})")
        else:
            out.append("\nNo explicit two-decade trend statements regarding apple temperature/rainfall were found in the retrieved sources.")
        return "\n".join(out)

    if cls.get("asks_smallholders") and cls.get("asks_crops"):
        crops = set()
        schemes = set()
        known_scheme_patterns = [r"\bNABARD\b", r"\bPMKSY\b", r"\bNFSM\b", r"\bRKVY\b", r"\bMIDH\b", r"\bNational Horticulture Mission\b", r"\bPradhan\b"]
        for ex in extracted:
            txt = (ex.get("answer","") + " " + ex.get("context",""))
            for m in re.findall(r"\b(wheat|mustard|barley|pea|lentil|millet|maize|buckwheat|ragi)\b", txt, flags=re.I):
                crops.add(m.capitalize())
            for pat in known_scheme_patterns:
                if re.search(pat, txt, flags=re.I):
                    schemes.add(re.search(pat, txt, flags=re.I).group(0))
        out_lines = []
        if crops:
            out_lines.append("Winter crops mentioned as suitable for small landholders in hill districts (from sources):")
            for c in sorted(crops):
                out_lines.append(f"- {c}")
        else:
            out_lines.append("Sources did not list specific winter crops clearly for small landholders in hill districts.")
        if schemes:
            out_lines.append("\nGovernment schemes/programs referenced in the sources:")
            for s in sorted(schemes):
                out_lines.append(f"- {s}")
        else:
            out_lines.append("\nNo explicit government scheme names supporting these crops were found in the retrieved sources.")
        return "\n".join(out_lines)

    if cls.get("asks_roles"):
        roles = set()
        for ex in extracted:
            c = ex.get("context","").lower()
            if re.search(r"spray|spraying|pesticid", c):
                roles.add("spraying of pesticides and inputs")
            if re.search(r"seed|seeding|deposit|drop", c):
                roles.add("seeding / input delivery")
            if re.search(r"geo[- ]?fenc|geofence|geofenc", c):
                roles.add("geo-fenced precision input delivery")
            if re.search(r"monitor|ndvi|remote sensing|mapping|survey|detect", c):
                roles.add("monitoring / remote sensing for crop health")
        if roles:
            return "Drones roles (from sources):\n" + "\n".join(f"- {r}" for r in sorted(roles))
        return "The sources mention drone usage but do not list multiple clear roles."

    if extracted:
        best = extracted[0]
        nums = scan_numbers_with_evidence(best.get("context",""))
        if not nums:
            return best.get("answer","No direct answer found.")
        lines = [best.get("answer","")]
        lines.append("\nNumbers found in the evidence (qualified):")
        for n in nums:
            if n["label"] == "unqualified":
                lines.append(f"- {n['raw']} — context: \"{n['evidence']}\" (unclear what this number refers to)")
            else:
                lines.append(f"- {n['raw']} — labeled as {n['label']}. Evidence: \"{n['evidence']}\"")
        return "\n".join(lines)

    return "No reliable answer or supporting evidence found in retrieved documents."

# ---------------- Top-level: generate answer ----------------
def generate_answer(query: str, vectorstore: FAISS) -> Dict:
    cls = classify_query(query)
    candidates = retrieve_and_rerank(query, vectorstore, cls)
    if not candidates:
        return {"query": query, "answer": "No relevant documents found.", "sources": []}
    extracted = extract_from_candidates(query, candidates)
    sources = []
    for ex in extracted[:6]:
        sources.append({"source": ex.get("source","Unknown"), "has_span": bool(ex.get("answer")), "snippet": (ex.get("answer") or ex.get("context","")[:200]).strip()})
    final = synthesize_answer(query, cls, extracted)
    return {"query": query, "answer": final, "sources": sources, "extracted": extracted[:6]}

# ---------------- Convenience main for local testing ----------------
if __name__ == "__main__":
    # quick local-run helper (optional)
    vs = None
    if os.path.exists(os.path.join(FAISS_INDEX_DIR, "index.faiss")):
        vs = load_faiss_index(FAISS_INDEX_DIR)
    else:
        if not os.path.exists(CHUNKS_JSONL):
            if not os.path.exists(PROCESSED_TXT_DIR) or len(list(Path(PROCESSED_TXT_DIR).glob("*.txt"))) == 0:
                extract_pdfs_to_txt(PDF_INPUT_DIR, PROCESSED_TXT_DIR)
            chunk_all_texts(PROCESSED_TXT_DIR, CHUNKS_JSONL)
        vs = build_faiss_index(CHUNKS_JSONL, FAISS_INDEX_DIR)
    init_models()
    print("RAG core ready.")
