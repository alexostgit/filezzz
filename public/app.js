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
    }
});

async function loadFiles() {
    try {
        const response = await fetch('/files');

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

            listItem.innerHTML = `
                <a class="download-link" href="/download?fileName=${file}" download>${file}</a>
                <button class="delete-button" data-filename="${file}">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24">
                        <path fill="red" d="M19 7L5 21M5 7l14 14" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            `;

            fileList.appendChild(listItem);
        });

        // Attach event listeners to delete buttons
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const fileName = e.target.closest('.delete-button').dataset.filename;
                if (confirm(`Are you sure you want to delete ${fileName}?`)) {
                    await deleteFile(fileName);
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

            return `${hours}:${minutes}:${seconds} | ${day}.${month}.${year}`;
        };

        // Render sorted logs
        document.getElementById('ticker').innerHTML = logs.map(log => `
            <tr>
                <td>${log.message}</td>
                <td>${formatTimestamp(log.timestamp)}</td>
            </tr>`).join('');
    } catch (error) {
        console.error("Error fetching ticker:", error);
    }
}

async function deleteFile(fileName) {
    try {
        loader.style.display = 'flex';

        const response = await fetch(`/delete?fileName=${fileName}`, { method: 'DELETE' });
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
    notification.style.opacity = '1';
    notification.innerHTML = text;
    notification.style.backgroundColor = bg;

    // Hide the notification after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 5000);
}