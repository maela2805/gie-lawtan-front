import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductionService } from '../services/production.service';
import { ApiService } from '../../../core/services/api.service';
import { catchError, forkJoin, of } from 'rxjs';
import { LucideAngularModule, ClipboardList, CheckCircle2, Factory, Mic, MicOff, Warehouse, DollarSign, Calculator, AlertCircle, Play, Square, Check, X, Volume2 } from 'lucide-angular';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-cloture',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './cloture.html',
  styleUrl: './cloture.scss',
})
export class Cloture implements OnInit {
  readonly ClipboardList = ClipboardList;
  readonly CheckCircle2 = CheckCircle2;
  readonly Factory = Factory;
  readonly Mic = Mic;
  readonly MicOff = MicOff;
  readonly Warehouse = Warehouse;
  readonly DollarSign = DollarSign;
  readonly Calculator = Calculator;
  readonly AlertCircle = AlertCircle;
  readonly Play = Play;
  readonly Square = Square;
  readonly Check = Check;
  readonly X = X;
  readonly Volume2 = Volume2;

  ofsEnProduction: any[] = [];
  selectedOF: any = null;
  openModal = false;
  toastMessage = '';

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;

  // Enregistrement Vocal / Mémo Audio
  isRecording = false;
  audioBlob: Blob | null = null;
  audioUrl: string | null = null;
  recordingSeconds = 0;
  private mediaRecorder: any = null;
  private audioChunks: any[] = [];
  private timerInterval: any = null;

  entrepotOptions = ['Dépôt principal', 'Magasin Sud', 'Zone Usine Rizerie', 'Hangar Paille & Sous-produits'];

  // Formulaire de clôture
  clotureForm = {
    nombreSacsReels: 200,
    paddyConsomme: 16000, // kg
    justificationEcart: '',
    entrepotDestination: 'Dépôt principal',

    // 4 Produits principaux
    rizEntierSacs: 160,
    rizEntierKg: 8000,
    prixUnitaireEntier: 380,

    rizIntermediaireSacs: 32,
    rizIntermediaireKg: 1600,
    prixUnitaireIntermediaire: 360,

    rizBriseSacs: 16,
    rizBriseKg: 800,
    prixUnitaireBrise: 320,

    fineBrisureSacs: 10,
    fineBrisureKg: 480,
    prixUnitaireFine: 260,

    // 2 Sous-produits
    sonDeRizSacs: 60,
    sonDeRizKg: 2400,
    prixUnitaireSon: 210,

    balleDeRizSacs: 160,
    balleDeRizUnites: 1600,
    prixUnitaireBalle: 25,

    observationsResultat: ''
  };

  constructor(
    private productionService: ProductionService,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.markForCheck();
    }, 5000);
  }

  get paginatedOFs(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.ofsEnProduction.slice(start, start + this.pageSize);
  }

  loadData() {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.productionService.listOrdresFabrication().pipe(
      catchError(() => of([]))
    ).subscribe((ofs: any[]) => {
      this.ofsEnProduction = ofs?.filter((o: any) => o.statut === 'En production') || [];
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  openClotureModal(ofItem: any) {
    this.selectedOF = ofItem;
    const sacsPrev = ofItem.nombreSacsPrevisionnel || ofItem.nombreSacs || 200;
    const paddyApprox = sacsPrev * 80;

    this.clotureForm = {
      nombreSacsReels: sacsPrev,
      paddyConsomme: paddyApprox,
      justificationEcart: '',
      entrepotDestination: 'Dépôt principal',

      rizEntierSacs: Math.round(sacsPrev * 0.8),
      rizEntierKg: Math.round(paddyApprox * 0.50),
      prixUnitaireEntier: 380,

      rizIntermediaireSacs: Math.round(sacsPrev * 0.16),
      rizIntermediaireKg: Math.round(paddyApprox * 0.10),
      prixUnitaireIntermediaire: 360,

      rizBriseSacs: Math.round(sacsPrev * 0.08),
      rizBriseKg: Math.round(paddyApprox * 0.05),
      prixUnitaireBrise: 320,

      fineBrisureSacs: Math.round(sacsPrev * 0.05),
      fineBrisureKg: Math.round(paddyApprox * 0.03),
      prixUnitaireFine: 260,

      sonDeRizSacs: Math.round(sacsPrev * 0.30),
      sonDeRizKg: Math.round(paddyApprox * 0.15),
      prixUnitaireSon: 210,

      balleDeRizSacs: Math.round(sacsPrev * 0.8),
      balleDeRizUnites: Math.round(paddyApprox * 0.10),
      prixUnitaireBalle: 25,

      observationsResultat: ''
    };

    this.audioBlob = null;
    this.audioUrl = null;
    this.isRecording = false;
    this.recordingSeconds = 0;
    this.openModal = true;
    this.cdr.markForCheck();
  }

  // --- GESTION DU MÉMO VOCAL ---
  async toggleVoiceRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new (window as any).MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event: any) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        this.clotureForm.justificationEcart = `[Mémo vocal enregistré - ${this.recordingSeconds}s] ` + (this.clotureForm.justificationEcart || '');
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingSeconds = 0;
      this.timerInterval = setInterval(() => {
        this.recordingSeconds++;
        this.cdr.markForCheck();
      }, 1000);
    } catch (err) {
      alert("Impossible d'accéder au microphone. Veuillez vérifier les permissions de votre navigateur.");
    }
  }

  private stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((t: any) => t.stop());
    }
    this.isRecording = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.cdr.markForCheck();
  }

  onSacsChange(product: string, poidsParSac: number) {
    if (product === 'entier') this.clotureForm.rizEntierKg = (this.clotureForm.rizEntierSacs || 0) * poidsParSac;
    if (product === 'inter') this.clotureForm.rizIntermediaireKg = (this.clotureForm.rizIntermediaireSacs || 0) * poidsParSac;
    if (product === 'brise') this.clotureForm.rizBriseKg = (this.clotureForm.rizBriseSacs || 0) * poidsParSac;
    if (product === 'fine') this.clotureForm.fineBrisureKg = (this.clotureForm.fineBrisureSacs || 0) * poidsParSac;
    if (product === 'son') this.clotureForm.sonDeRizKg = (this.clotureForm.sonDeRizSacs || 0) * poidsParSac;
    if (product === 'balle') this.clotureForm.balleDeRizUnites = (this.clotureForm.balleDeRizSacs || 0) * poidsParSac;
  }

  get totalProduitsObtenusKg(): number {
    return (this.clotureForm.rizEntierKg || 0) +
           (this.clotureForm.rizIntermediaireKg || 0) +
           (this.clotureForm.rizBriseKg || 0) +
           (this.clotureForm.fineBrisureKg || 0) +
           (this.clotureForm.sonDeRizKg || 0) +
           (this.clotureForm.balleDeRizUnites || 0);
  }

  // Vérification stricte : le total des produits ne doit pas dépasser le paddy consommé
  get isDepassementMatiere(): boolean {
    const paddy = this.clotureForm.paddyConsomme || 0;
    return paddy > 0 && this.totalProduitsObtenusKg > paddy;
  }

  get ratioTransformation4Principaux(): number {
    const paddy = this.clotureForm.paddyConsomme || 0;
    if (paddy <= 0) return 0;
    const somme4 = (this.clotureForm.rizEntierKg || 0) +
                   (this.clotureForm.rizIntermediaireKg || 0) +
                   (this.clotureForm.rizBriseKg || 0) +
                   (this.clotureForm.fineBrisureKg || 0);
    return Number(((somme4 * 100) / paddy).toFixed(2));
  }

  get rendementSon(): number {
    const paddy = this.clotureForm.paddyConsomme || 0;
    if (paddy <= 0) return 0;
    return Number((((this.clotureForm.sonDeRizKg || 0) * 100) / paddy).toFixed(2));
  }

  get rendementBalle(): number {
    const paddy = this.clotureForm.paddyConsomme || 0;
    if (paddy <= 0) return 0;
    return Number((((this.clotureForm.balleDeRizUnites || 0) * 100) / paddy).toFixed(2));
  }

  get rendementSousProduits(): number {
    const paddy = this.clotureForm.paddyConsomme || 0;
    if (paddy <= 0) return 0;
    const sousProduits = (this.clotureForm.sonDeRizKg || 0) + (this.clotureForm.balleDeRizUnites || 0);
    return Number(((sousProduits * 100) / paddy).toFixed(2));
  }

  get rendementGlobal(): number {
    const paddy = this.clotureForm.paddyConsomme || 0;
    if (paddy <= 0) return 0;
    return Number(((this.totalProduitsObtenusKg * 100) / paddy).toFixed(2));
  }

  get totalValeurEstimee(): number {
    return ((this.clotureForm.rizEntierKg || 0) * (this.clotureForm.prixUnitaireEntier || 0)) +
           ((this.clotureForm.rizIntermediaireKg || 0) * (this.clotureForm.prixUnitaireIntermediaire || 0)) +
           ((this.clotureForm.rizBriseKg || 0) * (this.clotureForm.prixUnitaireBrise || 0)) +
           ((this.clotureForm.fineBrisureKg || 0) * (this.clotureForm.prixUnitaireFine || 0)) +
           ((this.clotureForm.sonDeRizKg || 0) * (this.clotureForm.prixUnitaireSon || 0)) +
           ((this.clotureForm.balleDeRizUnites || 0) * (this.clotureForm.prixUnitaireBalle || 0));
  }

  get ballePartClient(): number {
    return Number(((this.clotureForm.balleDeRizSacs || 0) * 0.5).toFixed(1));
  }

  get ballePartLawtan(): number {
    return Number(((this.clotureForm.balleDeRizSacs || 0) * 0.5).toFixed(1));
  }

  hasEcart(): boolean {
    const prev = this.selectedOF?.nombreSacsPrevisionnel || this.selectedOF?.nombreSacs || 0;
    return prev > 0 && this.clotureForm.nombreSacsReels !== prev;
  }

  handleSubmit() {
    if (!this.selectedOF) return;

    if (this.isDepassementMatiere) {
      alert(`⚠️ Erreur de Bilan Matière :\nLa somme totale des produits obtenus (${this.totalProduitsObtenusKg} kg) ne peut pas dépasser la quantité de paddy consommé (${this.clotureForm.paddyConsomme} kg).\nVeuillez réajuster les quantités saisies.`);
      return;
    }

    this.isSubmitting = true;
    this.cdr.markForCheck();

    const payload = {
      nombreSacsReels: this.clotureForm.nombreSacsReels,
      paddyConsomme: this.clotureForm.paddyConsomme,
      justificationEcart: this.clotureForm.justificationEcart,
      entrepotDestination: this.clotureForm.entrepotDestination,

      rizEntierSacs: this.clotureForm.rizEntierSacs,
      rizEntier: this.clotureForm.rizEntierKg,
      prixUnitaireEntier: this.clotureForm.prixUnitaireEntier,

      rizIntermediaireSacs: this.clotureForm.rizIntermediaireSacs,
      rizIntermediaire: this.clotureForm.rizIntermediaireKg,
      prixUnitaireIntermediaire: this.clotureForm.prixUnitaireIntermediaire,

      rizBriseSacs: this.clotureForm.rizBriseSacs,
      rizBrise: this.clotureForm.rizBriseKg,
      prixUnitaireBrise: this.clotureForm.prixUnitaireBrise,

      fineBrisureSacs: this.clotureForm.fineBrisureSacs,
      fineBrisure: this.clotureForm.fineBrisureKg,
      prixUnitaireFine: this.clotureForm.prixUnitaireFine,

      ratioTransformation: this.ratioTransformation4Principaux,

      sonDeRizSacs: this.clotureForm.sonDeRizSacs,
      sonDeRiz: this.clotureForm.sonDeRizKg,
      prixUnitaireSon: this.clotureForm.prixUnitaireSon,

      balleDeRizSacs: this.clotureForm.balleDeRizSacs,
      balleDeRiz: this.clotureForm.balleDeRizUnites,
      prixUnitaireBalle: this.clotureForm.prixUnitaireBalle,

      montantTotalPrestation: this.totalValeurEstimee,
      observationsResultat: this.clotureForm.observationsResultat
    };

    this.productionService.clotureOrdreFabrication(this.selectedOF.id, payload).pipe(
      catchError(err => {
        alert("Erreur lors de la clôture de l'OF.");
        this.isSubmitting = false;
        this.cdr.markForCheck();
        return of(null);
      })
    ).subscribe(res => {
      this.openModal = false;
      this.isSubmitting = false;
      if (res) {
        this.showToast(`✓ OF ${this.selectedOF.numero} clôturé avec succès ! Facture commerciale FAC-${this.selectedOF.numero} générée et stock mis à jour.`);
        this.loadData();
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  }
}
