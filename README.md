# Calc 2 Playground

Practice for Calc 2, sections 7.1 to 7.4 and 7.8: integration by parts, trig integrals, trig substitution, partial fractions, and improper integrals.

- **Study guide:** a step list for every scenario (29 of them, including how to solve the system of equations you get when matching coefficients), each with how to spot it, the steps on a worked example, a picture, the trap, and a practice problem. Plus a **Which method?** yes/no helper.
- **Practice** graded like a professor would: step by step, the whole answer at once, or quiz sets graded at the end.
- **Boss Quizzes**, a **Test Simulator** (12 questions, 30-minute timer you can pause), calculator, graph, scratchpad, unit circle, read-aloud, and a focus timer.

## Put it on your phone

Open **https://sahltyy.github.io/calc2-playground/**

- **iPhone:** open the link in Safari, tap **Share**, then **Add to Home Screen**.
- **Android:** open it in Chrome, tap the **⋮** menu, then **Add to Home screen** (or **Install app**).

Open it once while you are online. After that it opens with no connection, because a copy is saved on your phone.

## Offline

Everything works offline except **Ask Claude**, which only works in the version inside Claude. Here, the Ask button copies the problem and your work so far, so you can paste it into a chat with Claude, and links to the Claude version.

Progress (XP, mastery, streak) is saved per device and browser. The Claude version syncs with your Claude account; this copy keeps its own.

New versions arrive the next time you open the app with a connection.

## How it is built

- `src/` is the app: plain JavaScript and CSS, no framework. KaTeX draws the math.
- `node build.js` makes `dist/calc2-playground.html`, the version that runs inside Claude.
- `node build.js --web` makes `docs/`, the GitHub Pages site (installable, works offline).
- `npm test` checks every problem generator, the answer checker, and every worked example in the study guide.
- `test/*.py` are browser tests (Playwright). Run `python3 test/mkhtml.py` first, then any of them.
- `tools/make_icons.py` draws the home-screen icons into `assets/icons/`.
