const currentUser = 'Alex';
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const loader = document.getElementById('loader'); // Reference to the loader element


    if (!file) {
        showNotification('Please upload file first', 'red');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    formData.append('user', currentUser);
    try {
        // Show the loader
        loader.style.display = 'flex';

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            showNotification('File uploaded successsfully!', 'green');
            loadFiles();
            fetchTicker();
        } else {
            const error = await response.text();
            showNotification(`File upload failed: ${error}`, 'red');
        }
    } catch (error) {
        console.error("Upload error:", error);
        alert("An error occurred during the upload. Please try again.");
    } finally {
        // Hide the loader
        loader.style.display = 'none';
        document.getElementById('fileInput').value = null;

    }
});
async function loadFiles() {
    try {
        const response = await fetch('/files');
        const user = currentUser;
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        }

        const files = await response.json();
        console.log("Files loaded from server:", files);

        if (!Array.isArray(files)) {
            throw new TypeError("Expected an array of files");
        }

        const fileList = document.getElementById('filelist');
        fileList.innerHTML = '';

        files.forEach(file => {
            const listItem = document.createElement('li');
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2); // Convert bytes to MB
            const fileType = (/[.]/.exec(file.name)) ? /[^.]+$/.exec(file.name) : undefined;

            listItem.innerHTML = `
            <div class="file-item">
            <div>${file.name}</div>
            <div>${fileType}</div>
            <div>${fileSizeMB}MB</div>
            <div><a class="download-link" href="/download?fileName=${file.name}&user=${user}" download> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8 10C8 7.79086 9.79086 6 12 6C14.2091 6 16 7.79086 16 10V11H17C18.933 11 20.5 12.567 20.5 14.5C20.5 16.433 18.933 18 17 18H16.9C16.3477 18 15.9 18.4477 15.9 19C15.9 19.5523 16.3477 20 16.9 20H17C20.0376 20 22.5 17.5376 22.5 14.5C22.5 11.7793 20.5245 9.51997 17.9296 9.07824C17.4862 6.20213 15.0003 4 12 4C8.99974 4 6.51381 6.20213 6.07036 9.07824C3.47551 9.51997 1.5 11.7793 1.5 14.5C1.5 17.5376 3.96243 20 7 20H7.1C7.65228 20 8.1 19.5523 8.1 19C8.1 18.4477 7.65228 18 7.1 18H7C5.067 18 3.5 16.433 3.5 14.5C3.5 12.567 5.067 11 7 11H8V10ZM13 11C13 10.4477 12.5523 10 12 10C11.4477 10 11 10.4477 11 11V16.5858L9.70711 15.2929C9.31658 14.9024 8.68342 14.9024 8.29289 15.2929C7.90237 15.6834 7.90237 16.3166 8.29289 16.7071L11.2929 19.7071C11.6834 20.0976 12.3166 20.0976 12.7071 19.7071L15.7071 16.7071C16.0976 16.3166 16.0976 15.6834 15.7071 15.2929C15.3166 14.9024 14.6834 14.9024 14.2929 15.2929L13 16.5858V11Z" fill="rgb(49, 109, 200)"/>
</svg></a></div>
            <div><button class="delete-button" data-filename="${file.name}">
                    <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24">
                        <path fill="red" d="M19 7L5 21M5 7l14 14" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button></div>
            </div>
                
                
            `;

            fileList.appendChild(listItem);
        });

        // Attach event listeners to delete buttons
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const fileName = e.target.closest('.delete-button').dataset.filename;
                if (confirm(`Are you sure you want to delete ${fileName}?`)) {
                    await deleteFile(fileName, currentUser);
                    loadFiles(); // Refresh the file list
                    fetchTicker();
                }
            });
        });
    } catch (error) {
        console.error("Error loading files:", error);
    }
}
async function fetchTicker() {
    try {
        const response = await fetch('/ticker');
        const logs = await response.json();

        // Format timestamp
        const formatTimestamp = (timestamp) => {
            const date = new Date(timestamp);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
            const year = date.getFullYear();

            return `${hours}:${minutes}:${seconds} <br> ${day}.${month}.${year}`;
        };

        // Render sorted logs
        document.getElementById('ticker').innerHTML = logs.map(log => `
            <tr>
                <td>${log.user}</td>
                <td>${log.action}</td>
                <td>${log.message}</td>
                <td>${formatTimestamp(log.timestamp)}</td>
            </tr>`).join('');
    } catch (error) {
        console.error("Error fetching ticker:", error);
    }
}

async function deleteFile(fileName, user) {
    try {
        loader.style.display = 'flex';

        const response = await fetch(`/delete?fileName=${fileName}&user=${user}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`Failed to delete file: ${response.status} - ${response.statusText}`);
        }
        showNotification(`File ${fileName} deleted successfully!`, 'green')

    } catch (error) {
        console.error("Error deleting file:", error);
        showNotification(`Failed to delete file: ${error.message}`, 'red')

    } finally {
        loader.style.display = 'none';

    }
}



// Load files list on page load and at regular intervals
loadFiles();
fetchTicker();
setInterval(loadFiles, 10000); // Refresh file list every 10 seconds

// Ticker updates every 5 seconds
setInterval(fetchTicker, 5000);


function showNotification(text, bg) {
    const notification = document.getElementById('notification'); // Reference to the notification box

    // Show the notification
    notification.style.height = '50px';
    notification.style.opacity = '1';
    notification.style.marginTop = '2rem';

    notification.innerHTML = text;
    notification.style.backgroundColor = bg;

    // Hide the notification after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.height = '0';
        notification.style.marginTop = '0';

    }, 5000);
}