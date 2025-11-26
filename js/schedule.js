// Pobranie elementów
const weekPicker = document.getElementById("weekPicker");
const loadButton = document.getElementById("loadSchedule");
const weekTitle = document.getElementById("weekTitle");
const tableBody = document.querySelector("#scheduleTable tbody");
const slotHeight = 10; // używane w createLessonBlock
const GRID_TOP_OFFSET = 30; // px na górne etykiety godzin
// Funkcja pomocnicza: dla input type=week pobiera daty poniedziałku i niedzieli
function getWeekDates(weekValue) {
    const [year, week] = weekValue.split("-W").map(Number);
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay(); // niedziela = 0
    const monday = new Date(simple);
    monday.setDate(simple.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return [monday, sunday];
}

// Formatuj date jako YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split("T")[0];
}

// Funkcja pobierająca plan z backendu
function timeToPosition(time) {
    const [h, m] = time.split(":").map(Number);
    const startHour = 7; // pierwszy slot gridu
    const slotHeight = 80; // 1 slot = 1 godzina
    return (h - startHour) * slotHeight + (m / 60) * slotHeight;
}

function createLessonBlock(lesson, dayIndex) {
    const startSlot = timeToPosition(lesson.godzinaRozp);
    const endSlot = timeToPosition(lesson.godzinaKon);

    const block = document.createElement("div");
    block.classList.add("lesson-block");

    const GRID_TOP_OFFSET = 30; // wysokość nagłówka godzin
    block.style.top = `${startSlot}px`;
    block.style.left = `${dayIndex * (100 / 5)}%`; // 5 dni
    block.style.width = `${100 / 5 - 1}%`;
    block.style.height = `${endSlot - startSlot}px`;
	
	const lines = [
        lesson.przedmiot,
        lesson.lokacja,
        `${lesson.godzinaRozp.split(":").slice(0,2).join(":")} - ${lesson.godzinaKon.split(":").slice(0,2).join(":")}`,
        lesson.lektor
    ];

    // określamy maksymalną liczbę linii w bloku
    const lineHeight = 22; // px, musi pasować do CSS
    const maxLines = Math.floor((endSlot - startSlot) / lineHeight);

    // wstawiamy tylko tyle linii ile się zmieści
    block.innerHTML = lines.slice(0, maxLines).join("<br>");
	
	//otwarcie szczegolow
	block.addEventListener("click", () => {
        modalText.innerHTML = `
            <strong>Przedmiot:</strong> ${lesson.przedmiot}<br>
            <strong>Sala:</strong> ${lesson.lokacja}<br>
            <strong>Godziny:</strong> ${lesson.godzinaRozp.split(":").slice(0,2).join(":")} - ${lesson.godzinaKon.split(":").slice(0,2).join(":")}<br>
            <strong>Zajęcia z:</strong> ${lesson.lektor}<br>
            <strong>Data:</strong> ${lesson.data}
        `;

		const actions = document.getElementById("modalActions");
		actions.style.display = isLektor ? "block" : "none";

		//ID lekcji do późniejszych operacji
		actions.dataset.lessonId = lesson.id;
		
        modal.classList.remove("hidden");
    });
	
	
    return block;
}

async function loadSchedule() {
    const weekValue = weekPicker.value;
    const yearName = document.getElementById("yearSelect").value;
    if (!weekValue || !yearName) return;

    const [startDate, endDate] = getWeekDates(weekValue);
    weekTitle.textContent = `Plan zajęć od ${formatDate(startDate)} do ${formatDate(endDate)} (${yearName})`;

    try {
        const token = localStorage.getItem("jwt");
        const response = await fetch(`https://studentpanel-sw-dm.onrender.com/api/schedule?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&yearName=${yearName}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Błąd: ${response.status}`);
        const lessons = await response.json();

        const grid = document.getElementById("scheduleGrid");
        grid.innerHTML = ""; // wyczyść poprzednie bloki

        const daysMap = ["Pon", "Wt", "Śr", "Cz", "Pt"];
        lessons.forEach(lesson => {
            const date = new Date(lesson.data);
            const dayIndex = date.getDay() - 1; // Pon=1, Wt=2 ...
            if (dayIndex < 0 || dayIndex > 4) return; // tylko dni robocze
            const block = createLessonBlock(lesson, dayIndex);
            grid.appendChild(block);
        });
		console.log("drawing")
    } catch (err) {
        console.error(err);
        alert("Nie udało się pobrać planu.");
    }
}

// Event przycisku
loadButton.addEventListener("click", loadSchedule);

async function loadYearOptions() {
    const yearSelect = document.getElementById("yearSelect");

    try {
        const token = localStorage.getItem("jwt"); // jeśli endpoint wymaga JWT
        const response = await fetch("https://studentpanel-sw-dm.onrender.com/api/years", {
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });

        if (!response.ok) throw new Error("Błąd pobierania lat szkolnych");

        const years = await response.json();

        // Wyczyść istniejące opcje
        yearSelect.innerHTML = "";

        // Dodaj opcję domyślną
        yearSelect.innerHTML = `<option value="">Wybierz rok szkolny</option>`;

        // Dodaj opcje z backendu
        years.forEach(year => {
            const opt = document.createElement("option");
            opt.value = year;
            opt.textContent = year;
            yearSelect.appendChild(opt);
        });

    } catch (err) {
        console.error(err);
        yearSelect.innerHTML = `<option value="">Błąd ładowania</option>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadYearOptions(); // pobierz lata szkolne i wypełnij select
});

const timeLabelsContainer = document.querySelector(".time-labels");
for(let h = 7; h <= 21; h++) {
    const label = document.createElement("div");
    label.textContent = `${h}:00`;
    timeLabelsContainer.appendChild(label);
}

const modal = document.getElementById("lessonModal");
const modalText = document.getElementById("modalText");
const closeModal = document.getElementById("closeModal");

closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        // tylko jeśli modal jest widoczny
        if (!modal.classList.contains("hidden")) {
            modal.classList.add("hidden");
        }
    }
});

document.getElementById("editLessonBtn").addEventListener("click", async () => {
    const lessonId = document.getElementById("modalActions").dataset.lessonId;
    const token = localStorage.getItem("jwt");

    // Pobierz szczegóły lekcji
    const lessonResp = await fetch(`https://studentpanel-sw-dm.onrender.com/api/schedule/lessons/${lessonId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const lesson = await lessonResp.json();

    // Pobierz listę grup
    const groupsResp = await fetch("https://studentpanel-sw-dm.onrender.com/api/schedule/grupy", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const groups = await groupsResp.json();

    // Pobierz listę lektorów
    const lectorsResp = await fetch("https://studentpanel-sw-dm.onrender.com/api/schedule/lektorzy", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const lectors = await lectorsResp.json();

    // Budowanie HTML formularza
    modalText.innerHTML = `
        <h3>Edytuj zajęcia</h3>

        <label>Przedmiot:</label><br>
        <input id="editSubject" type="text" value="${lesson.przedmiot}"><br><br>

        <label>Sala:</label><br>
        <input id="editRoom" type="text" value="${lesson.lokacja}"><br><br>
		
		<label>Data zajęć:</label><br>
		<input id="editDate" type="date" value="${lesson.data}"><br><br>

        <label>Godzina start:</label><br>
        <input id="editStart" type="time" value="${lesson.godzinaRozp.slice(0,5)}"><br><br>

        <label>Godzina koniec:</label><br>
        <input id="editEnd" type="time" value="${lesson.godzinaKon.slice(0,5)}"><br><br>

        <label>Grupa:</label><br>
        <select id="editGroup"></select><br><br>

        <label>Lektor:</label><br>
        <select id="editLector"></select><br><br>

        <button id="saveEditBtn">Zapisz</button>
    `;

    // Wstawienie grup do selecta
    const groupSelect = document.getElementById("editGroup");
    groupSelect.innerHTML = groups
        .map(g => `<option value="${g.id}" ${g.id === lesson.grupaId ? "selected" : ""}>${g.nazwa}</option>`)
        .join("");

    // Wstawienie lektorów do selecta
    const lectorSelect = document.getElementById("editLector");
    lectorSelect.innerHTML = lectors
        .map(l => `<option value="${l.id}" ${l.id === lesson.lektorId ? "selected" : ""}>${l.nazwisko}</option>`)
        .join("");

    // Obsługa przycisku ZAPISZ
    document.getElementById("saveEditBtn").onclick = async () => {
        const updatedLesson = {
    id: parseInt(lessonId), // upewniamy się, że to liczba
	data: document.getElementById("editDate").value,
    przedmiot: document.getElementById("editSubject").value,
    lokacja: document.getElementById("editRoom").value,
    // dodajemy ":00" jeśli input type="time" zwraca "HH:mm"
    godzinaRozp: document.getElementById("editStart").value.length === 5
        ? document.getElementById("editStart").value + ":00"
        : document.getElementById("editStart").value,
    godzinaKon: document.getElementById("editEnd").value.length === 5
        ? document.getElementById("editEnd").value + ":00"
        : document.getElementById("editEnd").value,
    grupaId: parseInt(document.getElementById("editGroup").value),
	lektorId: parseInt(document.getElementById("editLector").value),
    lektor: document.getElementById("editLector").value
};


        await fetch("https://studentpanel-sw-dm.onrender.com/api/schedule/lessonUpdate", {
            method: "PUT",
            headers: {
				"Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
                
            },
            body: JSON.stringify(updatedLesson)
        });
		loadSchedule()
		modal.classList.add("hidden");
        //location.reload();
    };
});

document.getElementById("deleteLessonBtn").addEventListener("click", async () => {
    const lessonId = document.getElementById("modalActions").dataset.lessonId;
    const token = localStorage.getItem("jwt");

    if (!confirm("Czy na pewno usunąć zajęcia?")) return;

    await fetch(`https://studentpanel-sw-dm.onrender.com/api/schedule/lessonDelete/${lessonId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
	loadSchedule()
    //location.reload();
});

document.getElementById("addLessonBtn").onclick = async () => {
    modalText.innerHTML = `
        <h3>Dodaj nową lekcję</h3>

        <label>Data:</label><br>
        <input id="newDate" type="date"><br><br>

        <label>Przedmiot:</label><br>
        <input id="newSubject" type="text"><br><br>

        <label>Sala:</label><br>
        <input id="newRoom" type="text"><br><br>

        <label>Godzina start:</label><br>
        <input id="newStart" type="time"><br><br>

        <label>Godzina koniec:</label><br>
        <input id="newEnd" type="time"><br><br>

        <label>Grupa:</label><br>
        <select id="newGroup"></select><br><br>

        <label>Lektor:</label><br>
        <select id="newLector"></select><br><br>

        <button id="saveNewLessonBtn">Dodaj</button>
    `;

    // Wypełnij selecty grup i lektorów
    const groupSelect = document.getElementById("newGroup");
    const lectorSelect = document.getElementById("newLector");

    const token = localStorage.getItem("jwt");

    const [groupsResp, lectorsResp] = await Promise.all([
        fetch("https://studentpanel-sw-dm.onrender.com/api/schedule/grupy", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("https://studentpanel-sw-dm.onrender.com/api/schedule/lektorzy", { headers: { "Authorization": `Bearer ${token}` } })
    ]);

    const groups = await groupsResp.json();
    const lectors = await lectorsResp.json();

    groups.forEach(g => {
        const opt = document.createElement("option");
        opt.value = g.id;
        opt.textContent = g.nazwa;
        groupSelect.appendChild(opt);
    });

    lectors.forEach(l => {
        const opt = document.createElement("option");
        opt.value = l.id;
        opt.textContent = l.nazwisko;
        lectorSelect.appendChild(opt);
    });

    // Obsługa przycisku Dodaj
    document.getElementById("saveNewLessonBtn").onclick = async () => {
		const yearName = document.getElementById("yearSelect").value;
        const newLesson = {
            data: document.getElementById("newDate").value,
            przedmiot: document.getElementById("newSubject").value,
            lokacja: document.getElementById("newRoom").value,
            godzinaRozp: document.getElementById("newStart").value + ":00",
            godzinaKon: document.getElementById("newEnd").value + ":00",
            grupaId: parseInt(document.getElementById("newGroup").value),
            lektorId: parseInt(document.getElementById("newLector").value)
        };

        // Sprawdzenie, czy wszystkie pola są wypełnione
        if (!newLesson.data || !newLesson.przedmiot || !newLesson.lokacja ||
            !newLesson.godzinaRozp || !newLesson.godzinaKon || !newLesson.grupaId || !newLesson.lektorId) {
            alert("Wszystkie pola muszą być wypełnione!");
            return;
        }

        try {
            const resp = await fetch(`https://studentpanel-sw-dm.onrender.com/api/schedule/lessonCreate?yearName=${encodeURIComponent(yearName)}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newLesson)
            });

            if (resp.ok) {
                alert("Lekcja dodana!");
                modal.classList.add("hidden");
                loadSchedule(); // odśwież plan
            } else {
                const text = await resp.text();
                alert("Błąd dodawania lekcji: " + text);
            }
        } catch (err) {
            console.error(err);
            alert("Błąd sieci lub serwera");
        }
    };

    modal.classList.remove("hidden");
};