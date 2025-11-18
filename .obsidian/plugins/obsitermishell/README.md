# Obsitermishell Plugin

To install this plugin in Obsidian:

1. Copy all files from this directory to:
   `<your-vault>/.obsidian/plugins/obsitermishell/`

2. Restart Obsidian or reload plugins

3. Enable "Obsitermishell" in Settings → Community Plugins

4. The daemon will start automatically when the plugin loads

## Files included:
- main.js: Plugin code
- manifest.json: Plugin metadata
- daemon/: PTY daemon with node-pty (auto-starts with plugin)
- node_modules_plugin/: Native modules rebuilt for Obsidian's Electron

## Architecture:
This plugin uses a real PTY daemon to bypass Electron's security restrictions:
- The daemon runs as a separate Node.js process with real PTY capabilities
- The plugin communicates with the daemon via WebSocket (localhost only)
- This provides a true terminal experience with proper TTY support

## Troubleshooting:
If you get "Terminal daemon failed to start" errors:
- Make sure the daemon/ directory was copied correctly
- Check DevTools console for daemon error messages
- Verify Node.js is installed on your system

If terminals don't work properly:
- Make sure daemon/node_modules is installed (run `npm install` in daemon/)
- Try rebuilding node-pty: run the rebuild script in scripts/
- Reload the plugin to restart the daemon
