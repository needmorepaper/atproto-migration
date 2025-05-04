import '../styles/App.css';

export default function Footer() {
  return (
    <footer className="footer">
      Made by{' '}
      <a
        href="https://bsky.app/profile/noob.quest"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link"
      >
        <strong>@noob.quest</strong>
      </a>{' '}
      with hate 💔 | 
      <a
        href="https://tangled.sh/@noob.quest/atproto-migrator/"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link"
      >
        <strong> source code</strong>
      </a>
    </footer>
  );
} 