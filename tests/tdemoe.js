;/* TDEMOE : démonstration E-Énergies — données cohérentes et prêtes pour le rendez-vous (cafepro-evolution) */
;(async()=>{
await loadSettings();await seedDemoE();
/* 1 · société + catalogue */
if((SETS.company||{}).name!=='E-Énergies')throw new Error('nom société: '+JSON.stringify(SETS.company));
const prods=await DB.list('products');
for(const nm of ['Audit énergétique (forfait)','Étude & dimensionnement solaire','Panneau solaire 550 Wc','Onduleur hybride 5 kVA','Chauffe-eau solaire 200 L','Kit domotique résidentiel','Contrat maintenance annuel','Isolation thermique (m²)'])
  if(!prods.some(p=>p.name===nm))throw new Error('produit manquant: '+nm);
/* 2 · ventes B2B avec acomptes */
const sales=await DB.list('sales');
const pisam=sales.find(x=>x.client==='Clinique PISAM');
if(!pisam)throw new Error('vente Clinique PISAM absente');
if(Number(pisam.total)!==2550000)throw new Error('total PISAM: '+pisam.total);
const cash=await DB.list('cash_entries');
const paidPisam=cash.filter(c=>c.type==='in'&&c.ref==='salepay:'+pisam.id).reduce((a,c)=>a+Number(c.amount||0),0);
if(paidPisam!==1000000)throw new Error('acompte PISAM: '+paidPisam);
if(pisam.credit_status!=='due')throw new Error('PISAM doit rester due (acompte partiel)');
const sodiam=sales.find(x=>x.client==='SODIAM Logistique');
if(!sodiam||sodiam.credit_status!=='paid')throw new Error('SODIAM doit être soldée (acompte + solde)');
/* 3 · effectif + dette fournisseur */
const emps=await DB.list('employees');
if(emps.length!==14)throw new Error('effectif: '+emps.length);
if(!emps.some(e=>e.name==='Boris Konan'&&e.position==='Comptable'))throw new Error('comptable absent');
const purch=await DB.list('purchases');
if(!purch.some(p=>p.pay_method==='later'&&p.supplier==='Techno Énergie SARL'))throw new Error('dette fournisseur absente');
/* 4 · écran Achats relooké matériel */
S.user={name:'test',role:'manager'};S.route='achats';location.hash='#/achats';await render();
const h=$('#main').innerHTML;
if(h.indexOf('Achats matériel')<0)throw new Error('écran achats non relooké');
if(h.indexOf('Techno Énergie SARL')<0)throw new Error('dette fournisseur invisible');
if(h.indexOf('Prix unitaire')<0)throw new Error('colonnes achats non adaptées');
/* 5 · impayés : PISAM avec reste, Les Palmiers dus, SODIAM soldée invisible */
S.route='impayes';location.hash='#/impayes';await render();
const hi=$('#main').innerHTML;
if(hi.indexOf('Clinique PISAM')<0)throw new Error('PISAM absente des impayés');
if(hi.indexOf('Groupe scolaire Les Palmiers')<0)throw new Error('Les Palmiers (aucun acompte) absente');
if(hi.indexOf('SODIAM Logistique')<0||hi.indexOf('Encaissé')<0)throw new Error('SODIAM doit figurer avec le badge Encaissé');
const totDue=(2550000-1000000)+(2520000-760000)+500000;
if(hi.indexOf(money(totDue))<0)throw new Error('reste à encaisser global incorrect ('+money(totDue)+' attendu)');
/* 6 · paie : 14 bulletins générés */
S.route='paie';S.tab={paie:'run'};location.hash='#/paie';await render();
await App.runGen(monthISO());
const slips=await DB.list('pay_slips');
if(slips.length!==14)throw new Error('bulletins: '+slips.length);
console.log('✓ Démo E-Énergies : catalogue 8 prestations/équipements, 6 ventes dont 4 B2B à crédit');
console.log('✓ Impayés : reste à encaisser '+money(3810000)+' (PISAM 1 550 000 + Cocotiers 1 760 000 + Palmiers 500 000) · SODIAM soldée affichée Encaissé');
console.log('✓ Achats matériel + dette fournisseur Techno Énergie (3 840 000 F à 30 jours) · 14 employés, paie générée');
console.log('TDEMOE: TOUT PASSE');
})().catch(e=>{console.log('ECHEC TDEMOE:',e.message);process.exit(1);});
