import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const framesList = document.getElementById("framesList");
const searchInput = document.getElementById("searchInput");

let allFrames = [];
let currentSelectedFrame = null;
let allBrands = [];
let activeBrandTarget = ""; // "add" və ya "edit" olduğunu müəyyən edir
let selectedBrandValue = "";

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

// Yeni məlumat əlavə etmə forması
const addModal = document.getElementById("addModal");
document.querySelector(".close-add").onclick = () => addModal.style.display = "none";

document.getElementById("addForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const brand = document.getElementById("inputModel").value; 
    const modelName = document.getElementById("inputModelName").value; 
    const serial = document.getElementById("inputSerial").value;
    const year = document.getElementById("inputYear") ? document.getElementById("inputYear").value : "";
    const price = document.getElementById("inputPrice").value;

    if (!brand) {
        showNotification("Zəhmət olmasa marka seçin!", "error");
        return;
    }

    try {
        await addDoc(collection(db, "frames"), {
            brand: brand,          
            modelName: modelName,  
            serial: serial,
            year: year,
            price: Number(price)
        });
        addModal.style.display = "none";
        document.getElementById("addForm").reset();
        document.getElementById("selectedBrandAddText").innerText = "Marka seçin...";
        document.getElementById("selectedBrandAddText").style.color = "#ffffff";
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

document.getElementById("editSelectBrandBtn").onclick = () => {
    activeBrandTarget = "edit";
    openCustomBrandModal();
};

document.getElementById("editBtn").onclick = () => {
    detailModal.style.display = "none";
    
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

// --- MARKA İDARƏETMƏSİ ---
const brandModal = document.getElementById("brandModal");

async function loadBrands() {
    try {
        const querySnapshot = await getDocs(collection(db, "brands"));
        allBrands = [];
        querySnapshot.forEach((docSnap) => {
            allBrands.push({ id: docSnap.id, ...docSnap.data() });
        });
        allBrands.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Markalar yüklənərkən xəta:", error);
    }
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
        await loadBrands();
        showNotification("Yeni marka uğurla əlavə olundu!", "success");
    } catch (error) {
        showNotification("Marka əlavə olunarkən xəta: " + error.message, "error");
    }
});

// --- SEÇİM MODALI (Marka yoxsa Açki) ---
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

// Yeni açki əlavə etmək modalındakı marka seçimi düyməsi
const selectBrandBtn = document.getElementById("selectBrandBtn");
if (selectBrandBtn) {
    selectBrandBtn.onclick = () => {
        activeBrandTarget = "add";
        openCustomBrandModal();
    };
}

// --- MARKALARIN SİYAHISI MODALI (Axtarış ilə) ---
const brandsListModal = document.getElementById("brandsListModal");
const openBrandsListBtn = document.getElementById("openBrandsListBtn");
const closeBrandsListBtn = document.querySelector(".close-brands-list");
const closeBrandsModalBtn = document.getElementById("closeBrandsModalBtn");
const brandsListContainer = document.getElementById("brandsListContainer");
const manageBrandSearchInput = document.getElementById("manageBrandSearchInput");

openBrandsListBtn.onclick = async () => {
    await loadBrands();
    if (manageBrandSearchInput) manageBrandSearchInput.value = "";
    renderManageBrandsList(allBrands);
    brandsListModal.style.display = "flex";
    if (manageBrandSearchInput) manageBrandSearchInput.focus();
};

closeBrandsListBtn.onclick = () => brandsListModal.style.display = "none";
closeBrandsModalBtn.onclick = () => brandsListModal.style.display = "none";

function renderManageBrandsList(brandsToDisplay) {
    brandsListContainer.innerHTML = "";
    if (brandsToDisplay.length === 0) {
        brandsListContainer.innerHTML = "<p style='text-align: center; color: #a0aec0; padding: 10px;'>Marka tapılmadı.</p>";
        return;
    }

    brandsToDisplay.forEach(brand => {
        const item = document.createElement("div");
        item.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #111625; padding: 10px 14px; border-radius: 8px; border: 1px solid #2d3748;";
        
        item.innerHTML = `
            <span style="color: #ffffff; font-weight: bold; font-size: 15px;">${brand.name}</span>
            <button class="delete-brand-btn" data-id="${brand.id}" style="background-color: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 13px;">Sil</button>
        `;
        
        brandsListContainer.appendChild(item);
    });

    document.querySelectorAll(".delete-brand-btn").forEach(btn => {
        btn.onclick = async (e) => {
            const brandId = e.target.getAttribute("data-id");
            try {
                await deleteDoc(doc(db, "brands", brandId));
                await loadBrands();
                const currentTerm = manageBrandSearchInput ? manageBrandSearchInput.value.toLowerCase().trim() : "";
                const filtered = allBrands.filter(b => b.name.toLowerCase().includes(currentTerm));
                renderManageBrandsList(filtered);
                showNotification("Marka uğurla silindi!", "success");
            } catch (error) {
                showNotification("Marka silinərkən xəta: " + error.message, "error");
            }
        };
    });
}

if (manageBrandSearchInput) {
    manageBrandSearchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = allBrands.filter(b => b.name.toLowerCase().includes(term));
        renderManageBrandsList(filtered);
    });
}

// --- XÜSUSİ FİLTR VƏ SEÇİM MODALI (Axtarış ilə) ---
const filterModal = document.getElementById("filterModal");
const brandFilterBtn = document.getElementById("brandFilterBtn");
const selectedBrandText = document.getElementById("selectedBrandText");
const filterBrandsContainer = document.getElementById("filterBrandsContainer");
const brandSearchInput = document.getElementById("brandSearchInput");

brandFilterBtn.onclick = async () => {
    await loadBrands();
    activeBrandTarget = ""; // Ana səhifə filtridir
    if (brandSearchInput) brandSearchInput.value = ""; 
    renderFilterBrandsList(allBrands);
    filterModal.style.display = "flex";
    if (brandSearchInput) brandSearchInput.focus();
};

document.querySelector(".close-filter-modal").onclick = () => {
    filterModal.style.display = "none";
};

async function openCustomBrandModal() {
    await loadBrands();
    if (brandSearchInput) brandSearchInput.value = "";
    renderFilterBrandsList(allBrands);
    filterModal.style.display = "flex";
    if (brandSearchInput) brandSearchInput.focus();
}

function renderFilterBrandsList(brandsToDisplay) {
    filterBrandsContainer.innerHTML = "";
    
    // Əgər əsas səhifə filtridirsə "Bütün Markalar" seçimi əlavə edirik
    if (activeBrandTarget !== "add" && activeBrandTarget !== "edit") {
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
    }

    if (brandsToDisplay.length === 0 && (activeBrandTarget === "add" || activeBrandTarget === "edit")) {
        filterBrandsContainer.innerHTML = "<p style='text-align: center; color: #a0aec0; padding: 10px;'>Marka tapılmadı.</p>";
        return;
    }

    brandsToDisplay.forEach(brand => {
        const item = document.createElement("div");
        item.style.cssText = "background: #111625; padding: 12px 14px; border-radius: 8px; border: 1px solid #2d3748; cursor: pointer; color: #ffffff;";
        item.innerText = brand.name;
        item.onclick = () => {
            if (activeBrandTarget === "add") {
                document.getElementById("inputModel").value = brand.name;
                document.getElementById("selectedBrandAddText").innerText = brand.name;
                document.getElementById("selectedBrandAddText").style.color = "#ffffff";
                filterModal.style.display = "none";
            } else if (activeBrandTarget === "edit") {
                document.getElementById("editInputBrand").value = brand.name;
                document.getElementById("selectedBrandEditText").innerText = brand.name;
                document.getElementById("selectedBrandEditText").style.color = "#ffffff";
                filterModal.style.display = "none";
            } else {
                selectedBrandValue = brand.name;
                selectedBrandText.innerText = brand.name;
                filterModal.style.display = "none";
                filterFrames();
            }
        };
        filterBrandsContainer.appendChild(item);
    });
}

if (brandSearchInput) {
    brandSearchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filteredBrands = allBrands.filter(b => b.name.toLowerCase().includes(term));
        renderFilterBrandsList(filteredBrands);
    });
}

// Bütün modalları çölə kliklədikdə bağlamaq
window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
        e.target.style.display = "none";
    }
});

// Səhifəyə ilk girişdə markaları və məlumatları yükləyirik
loadBrands();
loadFrames();