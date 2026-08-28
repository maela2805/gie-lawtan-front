import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StocksService } from '../services/stocks.service';
import { ApiService } from '../../../core/services/api.service';
import { LucideAngularModule, Plus, Wheat, FileText, Search, UserCheck, ShieldCheck, ChevronDown, Check, X } from 'lucide-angular';
import { catchError, forkJoin, of } from 'rxjs';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-paddy',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './paddy.html',
  styleUrl: './paddy.scss'
})
export class Paddy implements OnInit {
  readonly Plus = Plus;
  readonly Wheat = Wheat;
  readonly FileText = FileText;
  readonly Search = Search;
  readonly UserCheck = UserCheck;
  readonly ShieldCheck = ShieldCheck;
  readonly ChevronDown = ChevronDown;
  readonly Check = Check;
  readonly X = X;

  stocksPaddy: any[] = [];
  bonsReception: any[] = [];
  clients: any[] = [];
  varietiesPaddy: any[] = [];

  activeTab: 'CLIENTS' | 'LAWTAN' = 'CLIENTS';
  stockLawtanKg = 24800; // Stock propre GIE LAWTAN

  // Pagination
  currentPageClients = 1;
  pageSizeClients = 5;
  currentPageBrp = 1;
  pageSizeBrp = 5;

  isLoading = true;
  openBrpDialog = false;
  isSubmitting = false;
  searchTerm = '';
  toastMessage = '';

  // Sélecteur client avec recherche intégrée
  isClientDropdownOpen = false;
  clientSearchQuery = '';

  poidsManuellementModifie = false;

  formData = {
    date: new Date().toISOString().split("T")[0],
    heure: "08:00",
    clientId: '',
    clientNom: '',
    parcelle: '',
    variete: '',
    nombreSacs: 45,
    poidsTotal: 1125, // 45 sacs * 25 kg
    observations: '',
    agent: 'Agent de pesée',
  };

  constructor(
    private stocksService: StocksService,
    private api: ApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Écoute de l'onglet actif via query param (ex: /stocks/paddy?tab=lawtan)
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'lawtan') {
        this.activeTab = 'LAWTAN';
      } else {
        this.activeTab = 'CLIENTS';
      }
      this.cdr.markForCheck();
    });

    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      stocks: this.stocksService.listPaddy().pipe(catchError(() => of([]))),
      brps: this.stocksService.listBonsReception().pipe(catchError(() => of([]))),
      clients: this.api.get<any[]>('/commercial/clients').pipe(catchError(() => of([]))),
      articles: this.stocksService.listArticles().pipe(catchError(() => of([])))
    }).subscribe(({ stocks, brps, clients, articles }) => {
      this.stocksPaddy = stocks || [];
      this.bonsReception = brps || [];
      this.clients = clients || [];
      this.varietiesPaddy = (articles || []).filter(a => a.categorie === "Riz paddy" || a.designation?.includes("Sahel"));
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  get filteredStocksClients(): any[] {
    return this.stocksPaddy.filter(s => {
      if (s.clientNom?.includes('LAWTAN')) return false;
      return !this.searchTerm || s.clientNom?.toLowerCase().includes(this.searchTerm.toLowerCase());
    });
  }

  get paginatedStocksClients(): any[] {
    const start = (this.currentPageClients - 1) * this.pageSizeClients;
    return this.filteredStocksClients.slice(start, start + this.pageSizeClients);
  }

  get paginatedBRPs(): any[] {
    const start = (this.currentPageBrp - 1) * this.pageSizeBrp;
    return this.bonsReception.slice(start, start + this.pageSizeBrp);
  }

  get totalPaddyClientKg(): number {
    return this.filteredStocksClients.reduce((sum, s) => sum + (s.quantite || 0), 0);
  }

  // Liste des clients filtrés par le champ de recherche du sélecteur
  get filteredClientsList(): any[] {
    const list = [
      { id: 'LAWTAN', nom: 'GIE LAWTAN (Stock Propre)', telephone: 'Interne', isLawtan: true },
      ...this.clients
    ];
    if (!this.clientSearchQuery) return list;
    const q = this.clientSearchQuery.toLowerCase();
    return list.filter(c => 
      c.nom?.toLowerCase().includes(q) || 
      c.prenom?.toLowerCase().includes(q) || 
      c.telephone?.includes(q)
    );
  }

  selectClient(client: any) {
    if (client.isLawtan || client.id === 'LAWTAN') {
      this.formData.clientId = 'LAWTAN';
      this.formData.clientNom = 'GIE LAWTAN (Stock Propre)';
    } else {
      this.formData.clientId = String(client.id);
      this.formData.clientNom = `${client.prenom || ''} ${client.nom}`.trim();
    }
    this.isClientDropdownOpen = false;
    this.clientSearchQuery = '';
    this.cdr.markForCheck();
  }

  openDialog(): void {
    const firstClient = this.clients[0];
    this.formData = {
      date: new Date().toISOString().split("T")[0],
      heure: "08:00",
      clientId: firstClient ? String(firstClient.id) : 'LAWTAN',
      clientNom: firstClient ? `${firstClient.prenom || ''} ${firstClient.nom}`.trim() : 'GIE LAWTAN (Stock Propre)',
      parcelle: '',
      variete: 'Sahel 108 (Optionnel)',
      nombreSacs: 45,
      poidsTotal: 1125, // 45 * 25kg
      observations: '',
      agent: 'Chef Pont-Bascule',
    };
    this.poidsManuellementModifie = false;
    this.isClientDropdownOpen = false;
    this.clientSearchQuery = '';
    this.openBrpDialog = true;
    this.cdr.markForCheck();
  }

  closeDialog(): void {
    this.openBrpDialog = false;
    this.isSubmitting = false;
    this.isClientDropdownOpen = false;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  onNombreSacsChange(): void {
    if (!this.poidsManuellementModifie) {
      // Calcul automatique basé sur sacs de 25 kg
      this.formData.poidsTotal = (this.formData.nombreSacs || 0) * 25;
    }
  }

  onPoidsChange(): void {
    this.poidsManuellementModifie = true;
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  onSubmit(): void {
    this.isSubmitting = true;

    // Si le poids total n'est pas renseigné ou est 0, calcul automatique par défaut : 25 kg / sac
    const poidsFinal = (this.formData.poidsTotal && this.formData.poidsTotal > 0)
      ? Number(this.formData.poidsTotal)
      : (Number(this.formData.nombreSacs) * 25);

    const payload = {
      ...this.formData,
      poidsTotal: poidsFinal,
      clientId: this.formData.clientId === 'LAWTAN' ? 999 : Number(this.formData.clientId || 1),
      numero: `BRP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
    };

    this.stocksService.createBRP(payload).subscribe({
      next: () => {
        this.closeDialog();
        this.showToast(`✓ BRP ${payload.numero} créé avec succès ! (${poidsFinal} kg enregistrés)`);
        this.loadData();
      },
      error: () => {
        alert("Erreur lors de la création du BRP");
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  getSacs(quantite: number): number {
    return Math.round((quantite || 0) / 25);
  }
}
