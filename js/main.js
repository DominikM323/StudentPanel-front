/*document.getElementById('uploadToggle').addEventListener('click', () => {
    const section = document.getElementById('uploadSection');
    section.classList.toggle('hidden');
});*/


// --- 2. Efekty hover dla kart zadań ---
function attachTaskHover(task) {
    task.addEventListener('mouseover', () => {
        task.style.background = "#ddeeff";
    });
    task.addEventListener('mouseout', () => {
        task.style.background = "#f2f2f2";
    });
}


// --- 3. Obsługa kliknięcia zadania -> otwarcie panelu plików ---
function attachTaskClick(task) {
    task.addEventListener('click', () => {
        const panel = document.getElementById('filePanel');

        // Pobieranie nazwy zadania
        const title = task.querySelector('h4').innerText;

        // Ustawienie tytułu w panelu
        document.getElementById('filePanelTitle').innerText = title;

        // Pobranie plików powiązanych (z atrybutu data-files)
        const files = task.dataset.files ? task.dataset.files.split(',') : [];

        const fileList = document.getElementById('fileList');
        fileList.innerHTML = "";

        if (files.length === 0) {
            fileList.innerHTML = "<li>Brak plików dla tego zadania.</li>";
        } else {
            files.forEach(file => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${file.trim()}" target="_blank">${file.trim()}</a>`;
                fileList.appendChild(li);
            });
        }

        // Pokazanie panelu
        panel.classList.remove('hidden');
    });
}


// --- 4. Obsługa istniejących kart ---
document.querySelectorAll('.task').forEach(task => {
    attachTaskHover(task);
    attachTaskClick(task);
});


// --- 5. Dodawanie nowej karty przez JS + automatyczne podpięcie eventów ---
function addNewTask() {
    const list = document.querySelector('.task-list');
    const newTask = document.createElement('article');
    newTask.classList.add('task');

    // przykładowe powiązane pliki
    newTask.dataset.files = "files/zadanie1.pdf, files/zadanie1_dodatkowe.pdf";

    newTask.innerHTML = "<h4>Nowe zadanie</h4><p>Dostarczone przez JS.</p>";

    list.appendChild(newTask);

    // podpięcie eventów
    attachTaskHover(newTask);
    attachTaskClick(newTask);
}



document.addEventListener('DOMContentLoaded', async () => {
	
    const token = localStorage.getItem("jwt");
    // Użytkownik nie zalogowany → nic nie robimy
    if (!token) return;
	
    try {
        const response = await fetch('https://studentpanel-sw-dm.onrender.com/api/auth/me', {
            headers: { 'Authorization':`Bearer ${token.trim()}`}
        });
		
        if (!response.ok) return;

        const user = await response.json();
		console.log(user)
        if (user.type === 'lektor') {
			
            document.querySelectorAll('.menu-lektor')
                    .forEach(el => el.style.display = 'block');
        }

    } catch (e) {
        console.log("Błąd pobierania roli:", e);
    }
});


addNewTask();
