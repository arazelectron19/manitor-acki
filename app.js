import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const framesList = document.getElementById("framesList");
const searchInput = document.getElementById("searchInput");

let allFrames = [];
let currentSelectedFrame = null;

// Məlumatları Firebase-dən çəkmək
async function loadFrames() {
    framesList.innerHTML = `
        <div class="loader-container">
            <div class="spinner"></div>
            <p>Məlumatlar yüklənir...</p>
        </div>
    `;
    
    allFrames = [];
    
    try {
        const querySnapshot = await getDocs(collection(db, "frames"));
        querySnapshot.forEach((docSnap) => {
            allFrames.push({ id: docSnap.id, ...docSnap.data() });
        });
        displayFrames(allFrames);
    } catch (error) {
        framesList.innerHTML = `<p style="color: #ef4444; text-align: center;">Xəta baş verdi: ${error.message}</p>`;
    }
}

// Ekrana yazdırmaq
function displayFrames(frames) {
    framesList.innerHTML = "";
    if (frames.length === 0) {
        framesList.innerHTML = "<p style='text-align: center; color: #a0aec0;'>Heç bir açki tapılmadı.</p>";
        return;
    }

    frames.forEach(frame => {
        const card = document.createElement("div");
        card.className = "card";
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 10px; flex-wrap: wrap;">
                <h4 style="color: #3b82f6; font-size: 18px; margin: 0; word-break: break-all; flex: 1; min-width: 120px;">${frame.model}</h4>
                
                <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: auto;">
                    <span style="background: #111625; border: 1px solid #2d3748; padding: 4px 8px; border-radius: 6px; font-size: 12px; color: #94a3b8;">
                        Sıra: <strong style="color: #ffffff;">${frame.serial}</strong>
                    </span>
                    
                    <span style="background: #111625; border: 1px solid #2d3748; padding: 4px 8px; border-radius: 6px; font-size: 12px; color: #94a3b8;">
                        İl: <strong style="color: #ffffff;">${frame.year || '-'}</strong>
                    </span>
                    
                    <span style="color: #10b981; font-weight: bold; font-size: 15px; margin-left: 4px;">${frame.price} AZN</span>
                </div>
            </div>
        `;
        
        card.addEventListener("click", () => openDetailModal(frame));
        framesList.appendChild(card);
    });
}

// Axtarış funksiyası
searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allFrames.filter(f => f.model.toLowerCase().includes(term));
    displayFrames(filtered);
});

// Yeni məlumat əlavə etmə forması
const addModal = document.getElementById("addModal");
document.getElementById("addBtn").onclick = () => addModal.style.display = "flex";
document.querySelector(".close-add").onclick = () => addModal.style.display = "none";

document.getElementById("addForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const model = document.getElementById("inputModel").value;
    const serial = document.getElementById("inputSerial").value;
    const year = document.getElementById("inputYear") ? document.getElementById("inputYear").value : "";
    const price = document.getElementById("inputPrice").value;

    try {
        await addDoc(collection(db, "frames"), {
            model: model,
            serial: serial,
            year: year,
            price: Number(price)
        });
        addModal.style.display = "none";
        document.getElementById("addForm").reset();
        loadFrames();
    } catch (error) {
        alert("Xəta baş verdi: " + error.message);
    }
});

// Detal Modalı
const detailModal = document.getElementById("detailModal");
function openDetailModal(frame) {
    currentSelectedFrame = frame;
    document.getElementById("modalModelName").innerText = frame.model;
    document.getElementById("modalSerial").innerText = frame.serial;
    if(document.getElementById("modalYear")) {
        document.getElementById("modalYear").innerText = frame.year || '-';
    }
    document.getElementById("modalPrice").innerText = frame.price;
    detailModal.style.display = "flex";
}
document.querySelector(".close").onclick = () => detailModal.style.display = "none";

// Silmə Məntiqi (Təsdiq pəncərəsi olmadan birbaşa silinir)
document.getElementById("deleteBtn").onclick = async () => {
    try {
        await deleteDoc(doc(db, "frames", currentSelectedFrame.id));
        detailModal.style.display = "none";
        loadFrames();
    } catch (error) {
        alert("Silinərkən xəta baş verdi: " + error.message);
    }
};

// Dəyişdirmə (Redaktə) Məntiqi
const editModal = document.getElementById("editModal");
document.getElementById("editBtn").onclick = () => {
    detailModal.style.display = "none";
    document.getElementById("editInputModel").value = currentSelectedFrame.model;
    document.getElementById("editInputSerial").value = currentSelectedFrame.serial;
    if(document.getElementById("editInputYear")) {
        document.getElementById("editInputYear").value = currentSelectedFrame.year || '';
    }
    document.getElementById("editInputPrice").value = currentSelectedFrame.price;
    editModal.style.display = "flex";
};
document.querySelector(".close-edit").onclick = () => editModal.style.display = "none";

document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newModel = document.getElementById("editInputModel").value;
    const newSerial = document.getElementById("editInputSerial").value;
    const newYear = document.getElementById("editInputYear") ? document.getElementById("editInputYear").value : "";
    const newPrice = document.getElementById("editInputPrice").value;

    try {
        const frameRef = doc(db, "frames", currentSelectedFrame.id);
        await updateDoc(frameRef, {
            model: newModel,
            serial: newSerial,
            year: newYear,
            price: Number(newPrice)
        });
        editModal.style.display = "none";
        loadFrames();
    } catch (error) {
        alert("Yenilənərkən xəta baş verdi: " + error.message);
    }
});

loadFrames();