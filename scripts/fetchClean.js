import { parse } from '@postlight/parser';
import { decode } from 'html-entities';
import striptags from 'striptags';

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Missing ?url= parameter' });
    }

    const article = await parse(url);

    // Decode HTML entities and strip tags to extract clean text
    const rawContent = article.content || article.text || '';
    const decodedContent = decode(rawContent);
    let text = striptags(decodedContent).trim().replace(/\n{2,}/g, '\n\n');

    // Decode title
    const title = decode(article.title || '');

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    // Return only the cleaned title and body text
    res.status(200).json({
      title,
      text
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}