<script lang="ts">
  interface Props {
    html: string
  }

  let { html }: Props = $props()

  const srcDoc = $derived(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            padding: 1rem;
            font-family: system-ui, -apple-system, sans-serif;
            background-color: #ffffff;
            color: #000000;
          }
            
          p { margin: 1em 0; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `)
</script>

<iframe
  title="Email Preview"
  srcdoc={srcDoc}
  class="email-preview-iframe"
  sandbox="allow-same-origin"
></iframe>

<style>
  .email-preview-iframe {
    width: 100%;
    height: 100%;
    border: none;
    background-color: white;
    display: block;
  }
</style>
