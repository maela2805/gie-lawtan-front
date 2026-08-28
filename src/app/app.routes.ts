import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { authGuard } from './core/guards/auth-guard';
import { Dashboard } from './dashboard/dashboard';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', 
    component: MainLayout,
    canActivate: [authGuard], 
    children: [
      { path: '', component: Dashboard },
      // Stocks
      { path: 'stocks/paddy', loadComponent: () => import('./features/stocks/paddy/paddy').then(m => m.Paddy) },
      { path: 'stocks/produits-finis', loadComponent: () => import('./features/stocks/produits-finis/produits-finis').then(m => m.ProduitsFinis) },
      { path: 'stocks/bottes', loadComponent: () => import('./features/stocks/bottes/bottes').then(m => m.Bottes) },
      { path: 'stocks/mouvements', loadComponent: () => import('./features/stocks/mouvements/mouvements').then(m => m.Mouvements) },
      // Production
      { path: 'production/of', loadComponent: () => import('./features/production/of/of').then(m => m.Of) },
      { path: 'production/cloture', loadComponent: () => import('./features/production/cloture/cloture').then(m => m.Cloture) },
      { path: 'production/bottes', loadComponent: () => import('./features/production/bottes/bottes').then(m => m.Bottes) },
      { path: 'production/tableau-bord', loadComponent: () => import('./features/production/tableau-bord/tableau-bord').then(m => m.TableauBord) },
      // Parc
      { path: 'parc/machines', loadComponent: () => import('./features/parc/machines/machines').then(m => m.Machines) },
      { path: 'parc/prestations', loadComponent: () => import('./features/parc/prestations/prestations').then(m => m.Prestations) },
      { path: 'parc/maintenance', loadComponent: () => import('./features/parc/maintenance/maintenance').then(m => m.Maintenance) },
      // Ventes
      { path: 'ventes/clients', loadComponent: () => import('./features/ventes/clients/clients').then(m => m.Clients) },
      { path: 'ventes/devis', loadComponent: () => import('./features/ventes/catalogue/catalogue').then(m => m.Catalogue) },
      { path: 'ventes/factures', loadComponent: () => import('./features/ventes/factures/factures').then(m => m.Factures) },
      // RH
      { path: 'rh/employes', loadComponent: () => import('./features/rh/employes/employes').then(m => m.Employes) },
      { path: 'rh/pointages', loadComponent: () => import('./features/rh/pointages/pointages').then(m => m.Pointages) },
      { path: 'rh/tableau-bord', loadComponent: () => import('./features/rh/tableau-bord/tableau-bord').then(m => m.TableauBord) },
      // Finance
      { path: 'finance/caisse', loadComponent: () => import('./features/finance/caisse/caisse').then(m => m.Caisse) },
      { path: 'finance/rentabilite', loadComponent: () => import('./features/finance/rentabilite/rentabilite').then(m => m.Rentabilite) },
      // Achats
      { path: 'achats/fournisseurs', loadComponent: () => import('./features/achats/fournisseurs/fournisseurs').then(m => m.Fournisseurs) },
      { path: 'achats/commandes', loadComponent: () => import('./features/achats/commandes/commandes').then(m => m.Commandes) },
    ] 
  }
];

