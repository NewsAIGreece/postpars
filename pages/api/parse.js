import { parse } from '@postlight/parser';
import { load } from 'cheerio';
import { decode } from 'html-entities';

export default async function handler(req, res) {
  try {
    const { url, key } = req.query; // Added 'key' here

    // 1. SECURITY CHECK: Validate the API Key
    if (!key || key !== process.env.API_SECRET_KEY) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    }

    // 2. INPUT CHECK: Ensure a URL is provided
    if (!url) {
      return res.status(400).json({ error: 'Missing ?url= parameter' });
    }

    const article = await parse(url);
    
    // first: decode every HTML entity (so “&#x3B5;” → “ε”)
    const decodedHtml = decode(article.content);

    // then strip tags via Cheerio
    const $ = load(decodedHtml);
    const text = $('p')
      .map((i, el) => $(el).text().trim())
      .get()
      .filter(para => para.length > 0)
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n');

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json({
      title: decode(article.title || ''),
      text
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}