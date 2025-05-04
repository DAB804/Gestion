// gestion.js

document.addEventListener("DOMContentLoaded", () => {
  const sidebarLinks = document.querySelectorAll(".sidebar a");
  const sections = document.querySelectorAll("section");
  const forms = {
    produit: document.getElementById("produitForm"),
    commande: document.getElementById("commandeForm"),
    fournisseur: document.getElementById("fournisseurForm"),
    utilisateur: document.getElementById("adminLoginForm")
  };

  if (!localStorage.getItem("produits")) localStorage.setItem("produits", "[]");
  if (!localStorage.getItem("commandes")) localStorage.setItem("commandes", "[]");
  if (!localStorage.getItem("fournisseurs")) localStorage.setItem("fournisseurs", "[]");
  if (!localStorage.getItem("utilisateurs")) localStorage.setItem("utilisateurs", "[]");
  if (!localStorage.getItem("corbeille")) localStorage.setItem("corbeille", "[]");

  sidebarLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.dataset.section;
      sidebarLinks.forEach(l => l.classList.remove("active-link"));
      link.classList.add("active-link");
      sections.forEach(sec => sec.classList.toggle("active", sec.id === target));
      if (target === "accueil") updateDashboard();
      refreshAllTables();
    });
  });

  const getData = key => JSON.parse(localStorage.getItem(key) || "[]");
  const setData = (key, arr) => localStorage.setItem(key, JSON.stringify(arr));
  const showToast = (msg, isError = false) => {
    const t = document.createElement("div");
    t.className = `toast ${isError ? "toast-error" : "toast-success"}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  };

  function updateDashboard() {
    const produits = getData("produits");
    const commandes = getData("commandes");
    const fournisseurs = getData("fournisseurs");

    document.getElementById("countProduits").textContent = produits.length;
    document.getElementById("countCommandes").textContent = commandes.length;
    document.getElementById("countFournisseurs").textContent = fournisseurs.length;

    const valeur = produits.reduce((sum, p) => sum + p.quantite * p.prix, 0).toFixed(2);
    const stock = produits.reduce((sum, p) => sum + p.quantite, 0);
    document.querySelectorAll("#accueil p.stat").forEach(el => el.remove());
    appendStat(`Valeur totale du stock : ${valeur} €`);
    appendStat(`Stock total disponible : ${stock}`);
    

    const hors = produits.filter(p => p.quantite < 5 || p.quantite > 1000);
    if (hors.length) {
      appendStat(`⚠️ Produits hors seuil : ${hors.map(p => p.nom + "(" + p.quantite + ")").join(", ")}`, true);
    }
  }
   
  const appendStat = (text, warning = false) => {
    const p = document.createElement("p");
    p.classList.add("stat");
    p.style.color = warning ? "red" : "green";
    p.textContent = text;
    document.getElementById("accueil").appendChild(p);
  };

  function buildTable(containerId, data, columns, options = {}) {
    const cont = document.getElementById(containerId);
    cont.innerHTML = "";
    if (!data.length) {
      cont.innerHTML = "<p>Aucune donnée.</p>";
      return;
    }
    const tbl = document.createElement("table");
    tbl.className = "table table-bordered";

    const thead = document.createElement("thead"), trh = document.createElement("tr");
    columns.forEach(col => {
      const th = document.createElement("th");
      th.textContent = col.label;
      trh.appendChild(th);
    });
    if (options.actions) {
      const th = document.createElement("th");
      th.textContent = "Actions";
      trh.appendChild(th);
    }
    thead.appendChild(trh);
    tbl.appendChild(thead);

    const tbody = document.createElement("tbody");
    data.forEach((item, i) => {
      const tr = document.createElement("tr");
      columns.forEach(col => {
        const td = document.createElement("td");
        td.textContent = item[col.key];
        tr.appendChild(td);
      });
      if (options.actions) {
        const td = document.createElement("td");
        options.actions.forEach(act => {
          const btn = document.createElement("button");
          btn.className = act.class;
          btn.textContent = act.label;
          btn.addEventListener("click", () => act.onClick(i));
          td.appendChild(btn);
        });
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    cont.appendChild(tbl);
  }

  const supprimerItem = (type, i) => {
    const arr = getData(type);
    const removed = arr.splice(i, 1)[0];
    setData(type, arr);
    const corb = getData("Corbeille");
    corb.push({ type, data: JSON.stringify(removed), date: new Date().toLocaleString() });
    setData("Corbeille", corb);
    showToast(`${type} supprimé`, true);
    refreshAllTables();
  };

  document.getElementById("viderCorbeille")?.addEventListener("click", () => {
    if (confirm("Voulez-vous vraiment vider la corbeille ?")) {
      setData("corbeille", []);
      showToast("corbeille vidée");
      refreshAllTables();
    }
  });

  const modifierProduit = i => {
    const produits = getData("produits");
    const p = produits[i];
    const nom = prompt("Nouveau nom :", p.nom);
    const quantite = +prompt("Nouvelle quantité :", p.quantite);
    const prix = +prompt("Nouveau prix :", p.prix);
    const type = prompt("Type (entrée/sortie) :", p.type);
    if (nom && !isNaN(quantite) && !isNaN(prix)) {
      produits[i] = { ...p, nom, quantite, prix, type };
      setData("produits", produits);
      showToast("Produit modifié");
      refreshAllTables();
    }
  };

  function refreshAllTables() {
    updateDashboard();
    buildTable("listeProduitsTable", getData("produits"), [
      { key: "nom", label: "Produit" },
      { key: "quantite", label: "Quantité" },
      { key: "prix", label: "Prix (€)" },
      { key: "type", label: "Type" },
      { key: "date", label: "Date/Heure" }
    ], {
      actions: [
        { label: "🖉 Modifier", class: "btn btn-sm btn-warning", onClick: modifierProduit },
        { label: "🗑 Supprimer", class: "btn btn-sm btn-danger", onClick: i => supprimerItem("produits", i) }
      ]
    });

    buildTable("listeCommandesTable", getData("commandes"), [
      { key: "produit", label: "Produit" },
      { key: "quantite", label: "Quantité" },
      { key: "date", label: "Date/Heure" }
    ], {
      actions: [
        { label: "🗑 Supprimer", class: "btn btn-sm btn-danger", onClick: i => supprimerItem("commandes", i) }
      ]
    });

    buildTable("listeFournisseurs", getData("fournisseurs"), [
      { key: "nom", label: "Nom" },
      { key: "produit", label: "Produit" },
      { key: "contact", label: "Contact" },
      { key: "adresse", label: "Adresse" },
      { key: "date", label: "Date/Heure" }
    ], {
      actions: [
        { label: "🗑 Supprimer", class: "btn btn-sm btn-danger", onClick: i => supprimerItem("fournisseurs", i) }
      ]
    });

    buildTable("listeUtilisateursTable", getData("utilisateurs"), [
      { key: "nom", label: "Nom" },
      { key: "email", label: "Email" },
      { key: "role", label: "Rôle" },
      { key: "date", label: "Date/Heure" }
    ], {
      actions: [
        { label: "🗑 Supprimer", class: "btn btn-sm btn-danger", onClick: i => supprimerItem("utilisateurs", i) }
      ]
    });

    buildTable("listeCorbeille", getData("corbeille"), [
      { key: "type", label: "Type" },
      { key: "data", label: "Données supprimées" },
      { key: "date", label: "Date suppression" }
    ]);
  }

  forms.produit.addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(forms.produit);
    const p = {
      nom: f.get("nom"),
      quantite: +f.get("quantite"),
      prix: +f.get("prix"),
      type: f.get("type"),
      date: new Date().toLocaleString()
    };
    const arr = getData("produits");
    arr.push(p);
    setData("produits", arr);
    showToast("Produit ajouté");
    forms.produit.reset();
    refreshAllTables();
  });

  forms.commande.addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(forms.commande);
    const cmd = {
      produit: f.get("produit"),
      quantite: +f.get("quantite"),
      date: new Date().toLocaleString()
    };
    const arr = getData("commandes");
    arr.push(cmd);
    setData("commandes", arr);
    showToast("Commande ajoutée");
    forms.commande.reset();
    refreshAllTables();
  });

  forms.fournisseur.addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(forms.fournisseur);
    const prov = {
      nom: f.get("nom"),
      produit: f.get("produit"),
      contact: f.get("contact"),
      adresse: f.get("adresse"),
      date: new Date().toLocaleString()
    };
    const arr = getData("fournisseurs");
    arr.push(prov);
    setData("fournisseurs", arr);
    showToast("Fournisseur ajouté");
    forms.fournisseur.reset();
    refreshAllTables();
  });

  forms.utilisateur.addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(forms.utilisateur);
    const user = {
      nom: f.get("nom"),
      email: f.get("email"),
      role: "Admin",
      date: new Date().toLocaleString()
    };
    const arr = getData("utilisateurs");
    arr.push(user);
    setData("utilisateurs", arr);
    showToast("Utilisateur ajouté");
    forms.utilisateur.reset();
    refreshAllTables();
  });

  refreshAllTables();
});
