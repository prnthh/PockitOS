// Apps Menu Plugin for PockitOS
export async function registerAppsMenu(menubar, osInstance) {
  const appsBaseUrl = 'https://raw.githubusercontent.com/prnthh/PockitOS/refs/heads/main/apps/';
  menubar.addMenu('Apps', [{ label: 'Loading...', onClick: () => {} }]);
  try {
    const listingResp = await fetch(`${appsBaseUrl}listing.json`);
    const listing = await listingResp.json();
    const appOptions = Object.entries(listing).map(([name, url]) => ({
      label: name,
      onClick: async () => {
        const html = await (await fetch(appsBaseUrl + url)).text();
        osInstance.createApp({ value: html });
      }
    }));
    // Remove old Apps menu if present
    menubar.menubar.querySelectorAll('.relative.group').forEach(menu => {
      if (menu.textContent && menu.textContent.includes('Apps')) menu.remove();
    });
    menubar.addMenu('Apps', appOptions);
  } catch (e) {
    menubar.addMenu('Apps', [{ label: 'Error loading apps', onClick: () => {} }]);
  }
}