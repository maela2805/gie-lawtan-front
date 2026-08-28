import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { 
  LucideAngularModule, 
  LayoutDashboard, 
  ShoppingCart, 
  Truck, 
  Factory, 
  Wheat, 
  Boxes, 
  Users, 
  FileText, 
  Tags, 
  Tractor, 
  CalendarDays, 
  ClipboardList, 
  Wrench, 
  Wallet, 
  BarChart3, 
  HardHat, 
  FileClock, 
  History, 
  Settings, 
  Leaf, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Minus 
} from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    LucideAngularModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly Leaf = Leaf;
  readonly ChevronDown = ChevronDown;
  readonly ChevronRight = ChevronRight;
  readonly Plus = Plus;
  readonly Minus = Minus;

  isPaddyOpen = true;

  navGroups = [
    {
      titre: 'Pilotage',
      items: [
        { to: '/', label: 'Tableau de bord', icon: 'layout-dashboard' },
      ],
    },
    {
      titre: 'Stocks',
      hasPaddyDropdown: true,
      items: [
        { to: '/stocks/produits-finis', label: 'Produits Finis', icon: 'boxes' },
        { to: '/stocks/bottes', label: 'Bottes de Paille', icon: 'boxes' },
        { to: '/stocks/mouvements', label: 'Mouvements', icon: 'history' },
      ],
    },
    {
      titre: 'Production',
      items: [
        { to: '/production/of', label: 'Ordres de Fabrication', icon: 'factory' },
        { to: '/production/cloture', label: 'Clôture & Rendements', icon: 'clipboard-list' },
        { to: '/production/bottes', label: 'Pressage Bottes', icon: 'tractor' },
        { to: '/production/tableau-bord', label: 'Suivi Production', icon: 'bar-chart-3' },
      ],
    },
    {
      titre: 'Parc matériel & Prestations',
      items: [
        { to: '/parc/machines', label: 'Machines', icon: 'tractor' },
        { to: '/parc/prestations', label: "Ordres d'Intervention", icon: 'calendar-days' },
        { to: '/parc/maintenance', label: 'Maintenance', icon: 'wrench' },
      ],
    },
    {
      titre: 'Commercial',
      items: [
        { to: '/ventes/clients', label: 'Clients', icon: 'users' },
        { to: '/ventes/devis', label: 'Devis', icon: 'file-text' },
        { to: '/ventes/factures', label: 'Factures', icon: 'file-text' },
      ],
    },
    {
      titre: 'Ressources Humaines',
      items: [
        { to: '/rh/employes', label: 'Employés', icon: 'hard-hat' },
        { to: '/rh/pointages', label: 'Pointages Journaliers', icon: 'file-clock' },
        { to: '/rh/tableau-bord', label: 'Tableau de Bord RH', icon: 'bar-chart-3' },
      ],
    },
    {
      titre: 'Finance',
      items: [
        { to: '/finance/caisse', label: 'Caisse & Banque', icon: 'wallet' },
        { to: '/finance/rentabilite', label: 'Rentabilité', icon: 'bar-chart-3' },
      ],
    },
    {
      titre: 'Achats & Approvisionnements',
      items: [
        { to: '/achats/fournisseurs', label: 'Fournisseurs', icon: 'truck' },
        { to: '/achats/commandes', label: 'Bons de Commande', icon: 'shopping-cart' },
      ],
    },
    {
      titre: 'Configuration',
      items: [
        { to: '/parametres', label: 'Paramètres', icon: 'settings' },
      ],
    },
  ];

  constructor(public router: Router) {}

  togglePaddy() {
    this.isPaddyOpen = !this.isPaddyOpen;
  }
}
