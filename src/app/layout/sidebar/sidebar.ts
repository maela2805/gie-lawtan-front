import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { 
  LucideAngularModule, 
  LUCIDE_ICONS,
  LucideIconProvider,
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
  host: {
    class: 'block h-full w-full'
  },
  imports: [
    CommonModule, 
    RouterModule, 
    LucideAngularModule
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
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
      })
    }
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
        { to: '/', label: 'Tableau de bord', emoji: '📊' },
      ],
    },
    {
      titre: 'Stocks',
      hasPaddyDropdown: true,
      items: [
        { to: '/stocks/produits-finis', label: 'Produits Finis', emoji: '📦' },
        { to: '/stocks/bottes', label: 'Bottes de Paille', emoji: '🌾' },
        { to: '/stocks/mouvements', label: 'Mouvements', emoji: '🔄' },
      ],
    },
    {
      titre: 'Production',
      items: [
        { to: '/production/of', label: 'Ordres de Fabrication', emoji: '⚙️' },
        { to: '/production/cloture', label: 'Clôture & Rendements', emoji: '📋' },
        { to: '/production/bottes', label: 'Pressage Bottes', emoji: '🚜' },
        { to: '/production/tableau-bord', label: 'Suivi Production', emoji: '📈' },
      ],
    },
    {
      titre: 'Parc matériel & Prestations',
      items: [
        { to: '/parc/machines', label: 'Machines', emoji: '🚜' },
        { to: '/parc/prestations', label: "Ordres d'Intervention", emoji: '📅' },
        { to: '/parc/maintenance', label: 'Maintenance', emoji: '🔧' },
      ],
    },
    {
      titre: 'Commercial',
      items: [
        { to: '/ventes/clients', label: 'Clients', emoji: '👥' },
        { to: '/ventes/devis', label: 'Devis', emoji: '📝' },
        { to: '/ventes/factures', label: 'Factures', emoji: '📄' },
      ],
    },
    {
      titre: 'Ressources Humaines',
      items: [
        { to: '/rh/employes', label: 'Employés', emoji: '👷' },
        { to: '/rh/pointages', label: 'Pointages Journaliers', emoji: '⏱️' },
        { to: '/rh/tableau-bord', label: 'Tableau de Bord RH', emoji: '📊' },
      ],
    },
    {
      titre: 'Finance',
      items: [
        { to: '/finance/caisse', label: 'Caisse & Banque', emoji: '💰' },
        { to: '/finance/rentabilite', label: 'Rentabilité', emoji: '📈' },
      ],
    },
    {
      titre: 'Achats & Approvisionnements',
      items: [
        { to: '/achats/fournisseurs', label: 'Fournisseurs', emoji: '🚚' },
        { to: '/achats/commandes', label: 'Bons de Commande', emoji: '🛒' },
      ],
    },
    {
      titre: 'Configuration',
      items: [
        { to: '/parametres', label: 'Paramètres', emoji: '⚙️' },
      ],
    },
  ];

  constructor(public router: Router) {}

  togglePaddy() {
    this.isPaddyOpen = !this.isPaddyOpen;
  }
}
