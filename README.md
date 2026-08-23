# QUADCADE

QUADCADE is a browser-based campus gaming hub for discovering nearby players, creating temporary rooms, joining clubs, playing offline arcade games, earning coins, and customizing a profile. For the simple browser mode, open `quadcade/index.html`. For shared rooms, chat, invites, and leaderboards, install Node.js, run `npm start` from this folder, and open `http://localhost:3000/`.

The app uses plain HTML, CSS, and JavaScript with no build step or external runtime dependencies. The `quadcade` folder contains the pages and page-specific scripts; `style.css` contains the shared responsive pixel-art design and themes; `data.js` contains demo data; `audio.js` provides procedural music; `common.js` contains shared navigation, transitions, themes, and wallet helpers; and `storage.js` selects backend storage, `window.storage`, or browser `localStorage`.

The backend is `server.js`. It serves the `quadcade` folder and persists shared and per-browser data in `.quadcade-data.json`, which is ignored by Git. The backend is intended for local development and demonstration. Before public deployment, add authentication, authorization, input validation, rate limits, HTTPS, database backups, and a production database instead of exposing this demo server directly.

To edit the project, change the relevant HTML file for structure, its matching JavaScript file for behavior, `data.js` for demo content, and `style.css` for layout, colors, themes, and animation. Keep the script order at the bottom of each HTML page. Test both `file://` mode and `npm start` mode, then check the browser console and desktop/mobile layouts before committing changes.

Useful commands: `npm start` launches the local server, `http://localhost:3000/api/health` checks that the backend is running, and `git status` shows files ready for review. Do not commit `.quadcade-data.json`, private profile data, generated logs, or secrets. `README.txt` contains the longer plain-text version of this documentation.
