// gestion.js

// Navigation entre sections
function showSection(id, link) {
  document.querySelectorAll("section").forEach(sec => sec.classList.remove("active"));
  document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active-link"));
  document.getElementById(id).classList.add("active");
  if (link) link.classList.add("active-link");
}

// Afficher un toast (succès ou erreur)
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Générer la date actuelle
function getCurrentDateTime() {
  const now = new Date();
  return now.toLocaleString(); // Donne date + heure
}

// Mettre à jour le dashboard et le résumé
function updateDashboard() {
  const produits = document.getElementById("listeProduits").childElementCount;
  const commandes = document.getElementById("listeCommandes").childElementCount;
  const fournisseurs = document.getElementById("listeFournisseurs").childElementCount;
  const valeurStock = calculerValeurStock();

  document.getElementById("countProduits").textContent = produits;
  document.getElementById("countCommandes").textContent = commandes;
  document.getElementById("countFournisseurs").textContent = fournisseurs;

  document.getElementById("resume").innerHTML = `
    📦 Produits en stock : ${produits}<br>
    🛒 Commandes enregistrées : ${commandes}<br>
    🚚 Fournisseurs disponibles : ${fournisseurs}<br><br>
    💰 Valeur totale du stock : ${valeurStock} €
  `;
}

// Calculer la valeur totale du stock
function calculerValeurStock() {
  let total = 0;
  document.querySelectorAll("#listeProduits tr").forEach(tr => {
    const quantite = parseInt(tr.children[1].textContent);
    const prixTexte = tr.children[2].textContent.replace("€", "").trim();
    const prix = parseFloat(prixTexte);
    if (!isNaN(quantite) && !isNaN(prix)) {
      total += quantite * prix;
    }
  });
  return total.toFixed(2); // 2 chiffres après la virgule
}

// Vérification du stock (quantité < 10)
function checkStock(nom, quantite) {
  if (quantite < 10) {
    showToast(`Stock faible pour ${nom}!`, "error");
    ajouterCommandeAutomatique(nom);
  }
}

// Ajouter automatiquement une commande
function ajouterCommandeAutomatique(produit) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${produit}</td>
    <td>50</td>
    <td>
      <button class="btn btn-warning btn-sm btn-modifier">✏️</button>
      <button class="btn btn-danger btn-sm btn-supprimer">🗑️</button>
    </td>`;
  document.getElementById("listeCommandes").appendChild(tr);
  updateDashboard();
}

// Attacher suppression avec confirmation
function attachDelete(btn, row, type) {
  btn.addEventListener("click", () => {
    if (confirm(`Voulez-vous vraiment supprimer cette ${type} ?`)) {
      // Copier dans la corbeille
      const data = Array.from(row.children).slice(0, -1).map(td => td.textContent).join(" | ");
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${type}</td><td>${data}</td>`;
      document.getElementById("corbeilleTable").appendChild(tr);

      row.remove();
      updateDashboard();
      showToast(`${type} supprimé avec succès!`);
    }
  });
}

// Variables pour modification
let currentRow, currentType;

// Modification via modal
document.getElementById("modalModifierForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const nom = document.getElementById("modifNom").value;
  const quantite = document.getElementById("modifQuantite").value;
  const prix = document.getElementById("modifPrix")?.value;

  if (currentRow) {
    const cells = currentRow.querySelectorAll("td");
    cells[0].textContent = nom;
    if (quantite) cells[1].textContent = quantite;
    if (prix !== undefined) cells[2].textContent = prix + "€";
  }

  bootstrap.Modal.getInstance(document.getElementById('modalModifier')).hide();
  showToast(`${currentType} modifié avec succès!`);
  updateDashboard();
});

// Ajout d'élément
function setupForm(formId, tableId, type) {
  const form = document.getElementById(formId);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = Array.from(form.querySelectorAll("input, select"));
    const values = inputs.map(i => i.value);
    const dateNow = getCurrentDateTime();

    const tr = document.createElement("tr");

    if (type === "Produit") {
      tr.innerHTML = `
        <td>${values[0]}</td>
        <td>${values[1]}</td>
        <td>${values[2]}€</td>
        <td>${values[3]}</td>
        <td>${dateNow}</td>
        <td>
          <button class="btn btn-warning btn-sm btn-modifier">✏️</button>
          <button class="btn btn-danger btn-sm btn-supprimer">🗑️</button>
        </td>`;

      if (parseInt(values[1]) < 10) {
        checkStock(values[0], parseInt(values[1]));
      } else {
        showToast(`${type} ajouté avec succès!`);
      }

    } else if (type === "Commande") {
      tr.innerHTML = `
        <td>${values[0]}</td>
        <td>${values[1]}</td>
        <td>
          <button class="btn btn-warning btn-sm btn-modifier">✏️</button>
          <button class="btn btn-danger btn-sm btn-supprimer">🗑️</button>
        </td>`;
      if (parseInt(values[1]) < 10) {
        showToast(`Attention : quantité faible pour la commande de ${values[0]} !`, "error");
      } else {
        showToast(`${type} ajouté avec succès!`);
      }
    } else if (type === "Fournisseur") {
      tr.innerHTML = `
        <td>${values[0]}</td>
        <td>${values[1]}</td>
        <td>${values[2]}</td>
        <td>${values[3]}</td>
        <td>
          <button class="btn btn-warning btn-sm btn-modifier">✏️</button>
          <button class="btn btn-danger btn-sm btn-supprimer">🗑️</button>
        </td>`;
      showToast(`${type} ajouté avec succès!`);
    } else if (type === "Utilisateur") {
      tr.innerHTML = `
        <td>${values[0]}</td>
        <td>${values[1]}</td>
        <td>
          <button class="btn btn-warning btn-sm btn-modifier">✏️</button>
          <button class="btn btn-danger btn-sm btn-supprimer">🗑️</button>
        </td>`;
      showToast(`${type} ajouté avec succès!`);
    }

    // Attacher suppression et modification
    attachDelete(tr.querySelector(".btn-supprimer"), tr, type);
    tr.querySelector(".btn-modifier")?.addEventListener("click", () => {
      currentRow = tr;
      currentType = type;
      const cells = tr.querySelectorAll("td");
      document.getElementById("modifNom").value = cells[0].textContent;
      document.getElementById("modifQuantite").value = cells[1]?.textContent;
      if (cells[2]) {
        document.getElementById("modifPrix").value = parseFloat(cells[2].textContent);
      }
      new bootstrap.Modal(document.getElementById('modalModifier')).show();
    });

    document.getElementById(tableId).appendChild(tr);
    form.reset();
    updateDashboard();
  });
}

// Rechercher dans un tableau
function attachSearch(inputId, tableId) {
  document.getElementById(inputId).addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();
    document.querySelectorAll(`#${tableId} tr`).forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(value) ? "" : "none";
    });
  });
}

// Initialisation
window.addEventListener("DOMContentLoaded", () => {
  setupForm("produitForm", "listeProduits", "Produit");
  setupForm("commandeForm", "listeCommandes", "Commande");
  setupForm("fournisseurForm", "listeFournisseurs", "Fournisseur");
  setupForm("adminLoginForm", "listeUtilisateurs", "Utilisateur");

  attachSearch("rechercheProduit", "listeProduits");
  attachSearch("rechercheCommande", "listeCommandes");
  attachSearch("rechercheFournisseur", "listeFournisseurs");

  updateDashboard();
  showSection("accueil");
});
