import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const framesList = document.getElementById("framesList");
const searchInput = document.getElementById("searchInput");

let allFrames = [];
let currentSelectedFrame = null;

// --- BİLDİRİŞ (TOAST) FUNKSİYASI ---
function showNotification(message, type = "success") {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;
    toast.innerText = message;
    toast.className = `show ${type}`;
    
    setTimeout(() => {
        toast.className = "";
    }, 3000);
}

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

function displayFrames(frames) {
    framesList.innerHTML = "";
    if (frames.length === 0) {
        framesList.innerHTML = "<p style='text-align: center; color: #ef4444;'>Heç bir açki tapılmadı.</p>";
        return;
    }

    frames.forEach(frame => {
        const card = document.createElement("div");
        card.className = "card";
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 10px; flex-wrap: wrap;">
                <h4 style="color: #3b82f6; font-size: 18px; margin: 0; word-break: break-all; flex: 1; min-width: 120px;">
                    ${frame.brand} <span style="font-weight: normal; color: #94a3b8; font-size: 15px;">(${frame.modelName || ''})</span>
                </h4>
                
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
document.querySelector(".close-add").onclick = () => addModal.style.display = "none";

document.getElementById("addForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const brand = document.getElementById("inputModel").value; // Dropdown-dan seçilən marka (məs: Toyota)
    const modelName = document.getElementById("inputModelName").value; // Yeni yazdığınız model (məs: Corolla)
    const serial = document.getElementById("inputSerial").value;
    const year = document.getElementById("inputYear") ? document.getElementById("inputYear").value : "";
    const price = document.getElementById("inputPrice").value;

    if (!brand) {
        showNotification("Zəhmət olmasa marka seçin!", "error");
        return;
    }

    try {
        await addDoc(collection(db, "frames"), {
            brand: brand,          // Marka
            modelName: modelName,  // Model
            serial: serial,
            year: year,
            price: Number(price)
        });
        addModal.style.display = "none";
        document.getElementById("addForm").reset();
        loadFrames();
        showNotification("Açki uğurla əlavə olundu!", "success");
    } catch (error) {
        showNotification("Xəta baş verdi: " + error.message, "error");
    }
});

// Detal Modalı
const detailModal = document.getElementById("detailModal");
function openDetailModal(frame) {
    currentSelectedFrame = frame;
    
    // Marka və modeli düzgün oxumaq (köhnə və yeni məlumat uyğunluğu üçün)
    const brandText = frame.brand || frame.model || "";
    const modelText = frame.modelName ? `(${frame.modelName})` : "";
    
    document.getElementById("modalModelName").innerText = `${brandText} ${modelText}`;
    document.getElementById("modalSerial").innerText = frame.serial;
    if(document.getElementById("modalYear")) {
        document.getElementById("modalYear").innerText = frame.year || '-';
    }
    document.getElementById("modalPrice").innerText = frame.price;
    detailModal.style.display = "flex";
}
document.querySelector(".close").onclick = () => detailModal.style.display = "none";

// Silmə Məntiqi
document.getElementById("deleteBtn").onclick = async () => {
    try {
        await deleteDoc(doc(db, "frames", currentSelectedFrame.id));
        detailModal.style.display = "none";
        loadFrames();
        showNotification("Məlumat uğurla silindi!", "success");
    } catch (error) {
        showNotification("Silinərkən xəta baş verdi: " + error.message, "error");
    }
};

// Dəyişdirmə (Redaktə) Məntiqi
const editModal = document.getElementById("editModal");

// Redaktə zamanı marka seçimi qutusuna klikləndikdə
document.getElementById("editSelectBrandBtn").onclick = () => {
    activeBrandTarget = "edit";
    openCustomBrandModal();
};

document.getElementById("editBtn").onclick = () => {
    detailModal.style.display = "none";
    
    // Mövcud dəyərləri xanalara yazırıq
    const currentBrand = currentSelectedFrame.brand || currentSelectedFrame.model || "";
    document.getElementById("editInputBrand").value = currentBrand;
    document.getElementById("selectedBrandEditText").innerText = currentBrand || "Marka seçin...";
    document.getElementById("selectedBrandEditText").style.color = currentBrand ? "#ffffff" : "#a0aec0";

    document.getElementById("editInputModelName").value = currentSelectedFrame.modelName || "";
    document.getElementById("editInputSerial").value = currentSelectedFrame.serial || "";
    if(document.getElementById("editInputYear")) {
        document.getElementById("editInputYear").value = currentSelectedFrame.year || '';
    }
    document.getElementById("editInputPrice").value = currentSelectedFrame.price || "";
    
    editModal.style.display = "flex";
};
document.querySelector(".close-edit").onclick = () => editModal.style.display = "none";

document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newBrand = document.getElementById("editInputBrand").value;
    const newModelName = document.getElementById("editInputModelName").value;
    const newSerial = document.getElementById("editInputSerial").value;
    const newYear = document.getElementById("editInputYear") ? document.getElementById("editInputYear").value : "";
    const newPrice = document.getElementById("editInputPrice").value;

    if (!newBrand) {
        showNotification("Zəhmət olmasa marka seçin!", "error");
        return;
    }

    try {
        const frameRef = doc(db, "frames", currentSelectedFrame.id);
        await updateDoc(frameRef, {
            brand: newBrand,
            modelName: newModelName,
            serial: newSerial,
            year: newYear,
            price: Number(newPrice)
        });
        editModal.style.display = "none";
        loadFrames();
        showNotification("Məlumat uğurla yeniləndi!", "success");
    } catch (error) {
        showNotification("Yenilənərkən xəta baş verdi: " + error.message, "error");
    }
});
loadFrames();

// --- MARKA İDARƏETMƏSİ ---
let allBrands = [];
const brandModal = document.getElementById("brandModal");
const brandFilter = document.getElementById("brandFilter");

async function loadBrands() {
    try {
        const querySnapshot = await getDocs(collection(db, "brands"));
        allBrands = [];
        querySnapshot.forEach((docSnap) => {
            allBrands.push({ id: docSnap.id, ...docSnap.data() });
        });
        allBrands.sort((a, b) => a.name.localeCompare(b.name));
        updateBrandDropdowns();
    } catch (error) {
        console.error("Markalar yüklənərkən xəta:", error);
    }
}

function updateBrandDropdowns() {
    const inputModel = document.getElementById("inputModel");

    let filterHtml = '<option value="">Bütün Markalar</option>';
    let inputHtml = '<option value="">Marka seçin...</option>';

    allBrands.forEach(b => {
        filterHtml += `<option value="${b.name}">${b.name}</option>`;
        inputHtml += `<option value="${b.name}">${b.name}</option>`;
    });

    if (brandFilter) brandFilter.innerHTML = filterHtml;
    if (inputModel) inputModel.innerHTML = inputHtml;
}

// Marka modalını bağlamaq
if(document.querySelector(".close-brand")) {
    document.querySelector(".close-brand").onclick = () => brandModal.style.display = "none";
}

document.getElementById("brandForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const brandName = document.getElementById("inputNewBrand").value.trim();
    if (!brandName) return;

    try {
        await addDoc(collection(db, "brands"), { name: brandName });
        brandModal.style.display = "none";
        document.getElementById("brandForm").reset();
        loadBrands();
        showNotification("Yeni marka uğurla əlavə olundu!", "success");
    } catch (error) {
        showNotification("Marka əlavə olunarkən xəta: " + error.message, "error");
    }
});

// --- SEÇİM MODALI (Marka / Açki) ---
const choiceModal = document.getElementById("choiceModal");
const openChoiceModalBtn = document.getElementById("openChoiceModalBtn");
const closeChoiceBtn = document.querySelector(".close-choice");

openChoiceModalBtn.onclick = () => {
    choiceModal.style.display = "flex";
};

closeChoiceBtn.onclick = () => {
    choiceModal.style.display = "none";
};

document.getElementById("selectBrandOption").onclick = () => {
    choiceModal.style.display = "none";
    brandModal.style.display = "flex";
};

document.getElementById("selectFrameOption").onclick = () => {
    choiceModal.style.display = "none";
    addModal.style.display = "flex";
};

// Səhifəyə ilk girişdə markaları yükləyirik
loadBrands();

// --- MARKALARIN SİYAHISI MODALI ---
const brandsListModal = document.getElementById("brandsListModal");
const openBrandsListBtn = document.getElementById("openBrandsListBtn");
const closeBrandsListBtn = document.querySelector(".close-brands-list");
const closeBrandsModalBtn = document.getElementById("closeBrandsModalBtn");
const brandsListContainer = document.getElementById("brandsListContainer");

// Siyahı modalını açmaq
openBrandsListBtn.onclick = () => {
    renderBrandsList();
    brandsListModal.style.display = "flex";
};

// Siyahı modalını bağlamaq
closeBrandsListBtn.onclick = () => brandsListModal.style.display = "none";
closeBrandsModalBtn.onclick = () => brandsListModal.style.display = "none";

// Markaları modal içində səliqəli siyahı şəklində göstərmək
function renderBrandsList() {
    brandsListContainer.innerHTML = "";
    if (allBrands.length === 0) {
        brandsListContainer.innerHTML = "<p style='text-align: center; color: #a0aec0;'>Heç bir marka tapılmadı.</p>";
        return;
    }

    allBrands.forEach(brand => {
        const item = document.createElement("div");
        item.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #111625; padding: 10px 14px; border-radius: 8px; border: 1px solid #2d3748;";
        
        item.innerHTML = `
            <span style="color: #ffffff; font-weight: bold; font-size: 15px;">${brand.name}</span>
            <button class="delete-brand-btn" data-id="${brand.id}" style="background-color: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 13px;">Sil</button>
        `;
        
        brandsListContainer.appendChild(item);
    });

    // Siyahı daxilindəki silmə düymələrinə funksionallıq vermək
    document.querySelectorAll(".delete-brand-btn").forEach(btn => {
        btn.onclick = async (e) => {
            const brandId = e.target.getAttribute("data-id");
            try {
                await deleteDoc(doc(db, "brands", brandId));
                loadBrands(); // Siyahını və dropdown-ları yeniləyirik
                setTimeout(renderBrandsList, 300); // Modaldakı siyahını yenidən çəkirik
                showNotification("Marka uğurla silindi!", "success");
            } catch (error) {
                showNotification("Marka silinərkən xəta: " + error.message, "error");
            }
        };
    });
}

// --- XÜSUSİ FİLTR MODALI ---
const filterModal = document.getElementById("filterModal");
const brandFilterBtn = document.getElementById("brandFilterBtn");
const selectedBrandText = document.getElementById("selectedBrandText");
const filterBrandsContainer = document.getElementById("filterBrandsContainer");
let selectedBrandValue = "";

brandFilterBtn.onclick = () => {
    renderFilterBrandsList();
    filterModal.style.display = "flex";
};

document.querySelector(".close-filter-modal").onclick = () => {
    filterModal.style.display = "none";
};

function renderFilterBrandsList() {
    filterBrandsContainer.innerHTML = "";
    
    // "Bütün Markalar" seçimi
    const allOption = document.createElement("div");
    allOption.style.cssText = "background: #111625; padding: 12px 14px; border-radius: 8px; border: 1px solid #2d3748; cursor: pointer; color: #ffffff; font-weight: bold;";
    allOption.innerText = "Bütün Markalar";
    allOption.onclick = () => {
        selectedBrandValue = "";
        selectedBrandText.innerText = "Bütün Markalar";
        filterModal.style.display = "none";
        filterFrames();
    };
    filterBrandsContainer.appendChild(allOption);

    // Bazadakı markalar
    allBrands.forEach(brand => {
        const item = document.createElement("div");
        item.style.cssText = "background: #111625; padding: 12px 14px; border-radius: 8px; border: 1px solid #2d3748; cursor: pointer; color: #ffffff;";
        item.innerText = brand.name;
        item.onclick = () => {
            selectedBrandValue = brand.name;
            selectedBrandText.innerText = brand.name;
            filterModal.style.display = "none";
            filterFrames();
        };
        filterBrandsContainer.appendChild(item);
    });
}

function filterFrames() {
    const term = searchInput.value.toLowerCase().trim();
    const filtered = allFrames.filter(f => {
        const brandName = (f.brand || "").toLowerCase();
        const modelName = (f.modelName || "").toLowerCase();
        const serialNo = (f.serial || "").toString().toLowerCase();
        const yearVal = (f.year || "").toString().toLowerCase();

        const matchesSearch = brandName.includes(term) || modelName.includes(term) || serialNo.includes(term) || yearVal.includes(term);
        const matchesBrand = selectedBrandValue === "" || f.brand === selectedBrandValue;
        
        return matchesSearch && matchesBrand;
    });
    displayFrames(filtered);
}
searchInput.addEventListener("input", filterFrames);

// Bütün modalları çölə kliklədikdə bağlamaq
window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
        e.target.style.display = "none";
    }
});

// Redaktə modalını açan zaman (və ya editBtn kliklənərkən)
function openEditModal(frame) {
    // 1. Markaları select-ə yığırıq (əgər artıq funksiyanız varsa, markaları ora doldurmaq lazımdır)
    loadBrandsIntoSelect("editInputBrand"); 

    // 2. Mövcud dəyərləri inputlara yazırıq
    document.getElementById("editInputBrand").value = frame.brand || frame.model || "";
    document.getElementById("editInputModelName").value = frame.modelName || "";
    document.getElementById("editInputSerial").value = frame.serial || "";
    document.getElementById("editInputYear").value = frame.year || "";
    document.getElementById("editInputPrice").value = frame.price || "";
    
    editModal.style.display = "flex";
}

// --- XÜSUSİ MARKA SEÇİMİ MODALI ÜÇÜN DƏYİŞƏN VƏ FUNKSİYALAR ---
let activeBrandTarget = ""; // "add" və ya "edit" olduğunu müəyyən edir

// Əgər HTML-də xüsusi marka seçim modalınız yoxdursa və ya birbaşa menyudan seçirsinizsə:
function openCustomBrandModal() {
    // Əgər filter üçün olan filterModal-ı və ya xüsusi bir marka seçim modalı işlədirsinizsə buranı tənzimləyirik.
    // Ən sadə üsul olaraq mövcud filterModal-ı və ya marka siyahısını bu məqsədlə istifadə etməkdir:
    renderCustomBrandSelection();
}

function renderCustomBrandSelection() {
    const filterModal = document.getElementById("filterModal");
    const filterBrandsContainer = document.getElementById("filterBrandsContainer");
    const filterModalTitle = filterModal.querySelector("h3");
    
    if(filterModalTitle) filterModalTitle.innerText = "Marka Seçin";
    filterBrandsContainer.innerHTML = "";
    
    if (allBrands.length === 0) {
        filterBrandsContainer.innerHTML = "<p style='text-align: center; color: #a0aec0; padding: 10px;'>Əvvəlcə marka əlavə edin.</p>";
        filterModal.style.display = "flex";
        return;
    }

    allBrands.forEach(brand => {
        const item = document.createElement("div");
        item.style.cssText = "background: #111625; padding: 12px 14px; border-radius: 8px; border: 1px solid #2d3748; cursor: pointer; color: #ffffff;";
        item.innerText = brand.name;
        
        item.onclick = () => {
            if (activeBrandTarget === "add") {
                document.getElementById("inputModel").value = brand.name;
                document.getElementById("selectedBrandAddText").innerText = brand.name;
                document.getElementById("selectedBrandAddText").style.color = "#ffffff";
            } else if (activeBrandTarget === "edit") {
                document.getElementById("editInputBrand").value = brand.name;
                document.getElementById("selectedBrandEditText").innerText = brand.name;
                document.getElementById("selectedBrandEditText").style.color = "#ffffff";
            }
            filterModal.style.display = "none";
        };
        
        filterBrandsContainer.appendChild(item);
    });
    
    filterModal.style.display = "flex";
}

// Yeni açki əlavə etmə modalındakı marka seçimi düyməsi üçün dinləyici:
const selectBrandBtn = document.getElementById("selectBrandBtn");
if (selectBrandBtn) {
    selectBrandBtn.onclick = () => {
        activeBrandTarget = "add";
        openCustomBrandModal();
    };
}