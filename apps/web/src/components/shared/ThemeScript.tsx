import { ScriptOnce } from "@tanstack/react-router";

export function ThemeScript() {
	return (
		<ScriptOnce>
			{`(() => {
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldUseDark = stored === 'dark' || (!stored && prefersDark);
  root.classList.toggle('dark', shouldUseDark);
  root.classList.add('js-enabled');
})();`}
		</ScriptOnce>
	);
}
