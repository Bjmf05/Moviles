import { Router, Request, Response } from "express";

const router = Router();

// GET /api/translate?text=...&langpair=en|es
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const text = req.query.text as string | undefined;
  const langpair = (req.query.langpair as string | undefined) ?? "en|es";

  if (!text || text.trim() === "") {
    res.status(400).json({ error: "El parámetro 'text' es requerido" });
    return;
  }

  const email = process.env.MYMEMORY_EMAIL;
  const emailParam = email ? `&de=${encodeURIComponent(email)}` : "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}${emailParam}`;

  const upstream = await fetch(url);
  if (!upstream.ok) {
    res.status(502).json({ error: "Error al contactar MyMemory" });
    return;
  }

  const data = (await upstream.json()) as {
    responseStatus: number;
    responseData?: { translatedText?: string };
  };

  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    res.status(502).json({ error: "Respuesta inválida de MyMemory" });
    return;
  }

  res.json({ translatedText: data.responseData.translatedText });
});

export default router;
