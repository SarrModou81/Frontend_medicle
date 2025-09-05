// src/app/components/admin/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, User } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';

interface DashboardStats {
  utilisateurs: {
    total: number;
    patients: number;
    medecins: number;
    admins: number;
    nouveaux_ce_mois: number;
    actifs: number;
    inactifs: number;
  };
  rendez_vous: {
    total: number;
    ce_mois: number;
    confirmes: number;
    en_attente: number;
    annules: number;
    termines: number;
    aujourd_hui: number;
  };
  paiements: {
    total_revenus: number;
    revenus_ce_mois: number;
    paiements_en_ligne: number;
    paiements_cabinet: number;
    en_attente: number;
    echoues: number;
  };
  justificatifs: {
    total_generes: number;
    ce_mois: number;
    envoyes_email: number;
  };
  specialites_populaires: any[];
  medecins_actifs: number;
  evolution_mensuelle: any[];
}

interface QuickAction {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  
  stats: DashboardStats = {
    utilisateurs: {
      total: 0,
      patients: 0,
      medecins: 0,
      admins: 0,
      nouveaux_ce_mois: 0,
      actifs: 0,
      inactifs: 0
    },
    rendez_vous: {
      total: 0,
      ce_mois: 0,
      confirmes: 0,
      en_attente: 0,
      annules: 0,
      termines: 0,
      aujourd_hui: 0
    },
    paiements: {
      total_revenus: 0,
      revenus_ce_mois: 0,
      paiements_en_ligne: 0,
      paiements_cabinet: 0,
      en_attente: 0,
      echoues: 0
    },
    justificatifs: {
      total_generes: 0,
      ce_mois: 0,
      envoyes_email: 0
    },
    specialites_populaires: [],
    medecins_actifs: 0,
    evolution_mensuelle: []
  };

  quickActions: QuickAction[] = [
    {
      title: 'Gestion Utilisateurs',
      subtitle: 'Patients, Médecins, Admins',
      icon: 'people',
      route: '/admin/utilisateurs',
      color: 'primary'
    },
    {
      title: 'Spécialités Médicales',
      subtitle: 'Gérer les spécialités',
      icon: 'medical_services',
      route: '/admin/specialites',
      color: 'accent'
    },
    {
      title: 'Suivi Paiements',
      subtitle: 'Transactions et revenus',
      icon: 'payment',
      route: '/admin/paiements',
      color: 'warn'
    },
    {
      title: 'Statistiques Avancées',
      subtitle: 'Analyses et rapports',
      icon: 'analytics',
      route: '/admin/statistiques',
      color: 'primary'
    }
  ];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    this.apiService.getAdminDashboard().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dashboard:', error);
        this.snackBar.open('Erreur lors du chargement du dashboard', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  }

  getTauxCroissance(actuel: number, precedent: number): number {
    if (precedent === 0) return 100;
    return Math.round(((actuel - precedent) / precedent) * 100);
  }

  getSpecialiteColor(index: number): string {
    const colors = ['#3f51b5', '#ff4081', '#4caf50', '#ff9800', '#9c27b0'];
    return colors[index % colors.length];
  }
}