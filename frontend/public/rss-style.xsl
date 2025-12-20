<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:atom="http://www.w3.org/2005/Atom"
                xmlns:dc="http://purl.org/dc/elements/1.1/"
                xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="zh-CN">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> - RSS Feed</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <style type="text/css">
          body { max-width: 768px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif; line-height: 1.6; color: #333; padding: 2rem; background-color: #f9f9f9; }
          .header { background: #fff; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 2rem; text-align: center; }
          .header h1 { margin: 0 0 0.5rem 0; font-size: 1.8rem; color: #111; }
          .header p { color: #666; margin: 0; }
          .header a { color: #2563eb; text-decoration: none; font-weight: 500; }
          .header a:hover { text-decoration: underline; }
          .post { background: #fff; padding: 1.5rem; margin-bottom: 1.5rem; border-radius: 12px; border: 1px solid #e5e7eb; transition: transform 0.2s; }
          .post:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .post h3 { margin: 0 0 0.5rem 0; font-size: 1.25rem; }
          .post h3 a { color: #111; text-decoration: none; }
          .post h3 a:hover { color: #2563eb; }
          .meta { font-size: 0.875rem; color: #888; margin-bottom: 0.8rem; }
          .desc { font-size: 0.95rem; color: #4b5563; }
          .notice { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; }
          code { background: #eee; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.85em; }
        </style>
      </head>
      <body>
        <div class="notice">
          ℹ️ <strong>这是 RSS 订阅源</strong>：建议将本页面 URL 复制到 Feedly、Reeder 或其他 RSS 阅读器中订阅。
        </div>
        
        <div class="header">
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p><xsl:value-of select="/rss/channel/description"/></p>
          <p style="margin-top: 0.5rem">
            <a href="{/rss/channel/link}" target="_blank">访问网站 →</a>
          </p>
        </div>

        <xsl:for-each select="/rss/channel/item">
          <div class="post">
            <h3>
              <a href="{link}" target="_blank">
                <xsl:value-of select="title"/>
              </a>
            </h3>
            <div class="meta">
              发布于 <xsl:value-of select="pubDate"/>
            </div>
            <div class="desc">
              <xsl:value-of select="description"/>
            </div>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
