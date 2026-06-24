"use client";

export default function InstallInstructions() {
  return (
    <div className="card install" style={{ marginTop: 24 }}>
      <h2>⚙️ Installing in Outlook</h2>
      <p className="card-sub">
        Two reliable methods. The copy-paste method works for most users; the file method is the
        most robust for the new Outlook and for guaranteeing the logo embeds.
      </p>

      <div className="notice notice-info">
        <strong>Why this renders consistently:</strong> the signature is built from an HTML table
        with inline styles (no SVG, no background images). When you paste it into the Outlook
        signature editor, Outlook downloads the logo and stores it <em>locally</em> inside the
        signature — so the "block external images" setting that affects received mail does not
        affect your signature.
      </div>

      <p className="preview-label">Method A — Copy &amp; paste (classic Outlook, Outlook for Mac)</p>
      <ol>
        <li>
          Open signature settings:
          <br />
          <strong>Windows:</strong> <code>File → Options → Mail → Signatures</code>
          <br />
          <strong>Mac:</strong> <code>Outlook → Settings → Signatures</code>
        </li>
        <li>
          Click <strong>New</strong> (or <strong>+</strong>) and name it{" "}
          <code>Greenshades - Full</code>.
        </li>
        <li>
          Back here, click <strong>Copy full signature</strong>, then paste
          (<code>Ctrl+V</code> / <code>Cmd+V</code>) into the editor.
        </li>
        <li>
          Set it as the default for <strong>New messages</strong>.
        </li>
        <li>
          Repeat with a second signature named <code>Greenshades - Reply</code> using{" "}
          <strong>Copy reply signature</strong>; set it as default for{" "}
          <strong>Replies/forwards</strong>.
        </li>
        <li>Send yourself a test email to confirm both look correct.</li>
      </ol>

      <hr className="divider" />

      <p className="preview-label">Method B — Import the .htm file (new Outlook for Windows)</p>
      <ol>
        <li>
          Click <strong>Download .htm</strong> for each signature.
        </li>
        <li>
          Press <code>Win + R</code>, paste{" "}
          <code>%USERPROFILE%\AppData\Roaming\Microsoft\Signatures</code>, and press Enter.
        </li>
        <li>Move the downloaded <code>.htm</code> file(s) into that folder.</li>
        <li>Restart Outlook, then select the signature in Settings → Signatures.</li>
      </ol>

      <div className="notice notice-warn" style={{ marginTop: 16 }}>
        <strong>Please don't hand-edit your signature.</strong> Fonts, colors, sizing, and layout
        are standardized for brand consistency. If something looks off or you need a change, contact
        the Marketing team rather than editing manually.
      </div>
    </div>
  );
}
