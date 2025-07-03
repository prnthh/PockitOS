// Apps Menu Plugin for PockitOS
export async function registerAppsMenu(menubar, osInstance) {
  let appRepos = [
    'https://raw.githubusercontent.com/prnthh/PockitOS/refs/heads/main/apps/'
  ];
  if (!registerAppsMenu._repos) registerAppsMenu._repos = [...appRepos];
  appRepos = registerAppsMenu._repos;

  async function loadAppsFromRepo(baseUrl) {
    try {
      const listingResp = await fetch(`${baseUrl}listing.json`);
      const listing = await listingResp.json();
      return Object.entries(listing).map(([name, url]) => ({
        label: name,
        onClick: async () => {
          const html = await (await fetch(baseUrl + url)).text();
          osInstance.createApp({ value: html });
        }
      }));
    } catch (e) {
      return [{ label: `Error loading from ${baseUrl}`, onClick: () => {} }];
    }
  }

  async function updateMenu() {
    // Load all app options from all repos in parallel
    let allAppOptions = (await Promise.all(appRepos.map(loadAppsFromRepo))).flat();

    // Helper to add repo
    function showAddRepoModal() {
      import('../src/pockitos/modal.js').then(({ default: Modal }) => {
        const form = document.createElement('form');
        form.innerHTML = `
          <label class='mb-2 block font-bold'>App Repo Base URL:</label>
          <input type='text' name='baseurl' class='border px-2 py-1 w-full mb-4' placeholder='https://example.com/apps/' required />
          <div class='flex justify-end gap-2'>
            <button type='submit' class='bg-blue-600 text-white px-4 py-1 rounded'>Add</button>
            <button type='button' class='bg-gray-300 px-4 py-1 rounded' id='cancelBtn'>Cancel</button>
          </div>
        `;
        let modal = new Modal({ content: form });
        form.onsubmit = async (e) => {
          e.preventDefault();
          const url = form.baseurl.value.trim();
          if (url && !appRepos.includes(url)) {
            appRepos.push(url.endsWith('/') ? url : url + '/');
            registerAppsMenu._repos = appRepos;
            await updateMenu();
          }
          modal.close();
        };
        form.querySelector('#cancelBtn').onclick = () => modal.close();
      });
    }

    // Add the 'Add App Repo...' option
    allAppOptions.push({
      label: 'Add App Repo...',
      onClick: showAddRepoModal
    });

    // Remove old Apps menu if present
    menubar.menubar.querySelectorAll('.relative.group').forEach(menu => {
      if (menu.textContent && menu.textContent.includes('Apps')) menu.remove();
    });
    menubar.addMenu('Apps', allAppOptions);
  }

  // Initial load
  await updateMenu();
}