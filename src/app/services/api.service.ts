// src/app/services/api.service.ts - VERSION CORRIGÉE
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ============= INTERFACES =============
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
  client_secret?: string; // Pour les paiements Stripe
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'patient' | 'medecin' | 'admin';
  statut: 'actif' | 'inactif' | 'suspendu';
  telephone?: string;
  adresse?: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  medecin?: Medecin;
  nom_complet?: string;
}

export interface Patient {
  id: number;
  user_id: number;
  date_naissance?: string;
  sexe?: 'M' | 'F';
  profession?: string;
  allergies?: string;
  antecedents_medicaux?: string;
  mutuelle?: string;
  numero_securite_sociale?: string;
  user?: User;
}

export interface Medecin {
  id: number;
  user_id: number;
  specialite_id: number;
  numero_ordre: string;
  diplomes?: string;
  experience_annees: number;
  presentation?: string;
  cabinet_nom?: string;
  cabinet_adresse?: string;
  horaires_travail?: any;
  duree_consultation: number;
  prix_consultation: number;
  accepte_paiement_ligne: boolean;
  disponible: boolean;
  valide_par_admin?: boolean;
  user?: User;
  specialite?: Specialite;
  prochaine_disponibilite?: {
    date: string;
    heure: string;
  };
}

export interface Specialite {
  id: number;
  nom: string;
  description?: string;
  icone?: string;
  prix_consultation: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  medecins_count?: number;
}

export interface RendezVous {
  id: number;
  patient_id: number;
  medecin_id: number;
  date_heure: string;
  duree: number;
  motif?: string;
  statut: 'en_attente' | 'confirme' | 'annule' | 'termine';
  type_paiement: 'en_ligne' | 'au_cabinet';
  statut_paiement: 'en_attente' | 'paye' | 'rembourse';
  montant: number;
  notes_medecin?: string;
  confirme_at?: string;
  annule_at?: string;
  reference: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  medecin?: Medecin;
  paiement?: Paiement;
  justificatif?: Justificatif;
}

export interface Paiement {
  id: number;
  rendez_vous_id: number;
  patient_id: number;
  montant: number;
  methode: 'stripe' | 'especes' | 'carte' | 'cheque' | 'virement';
  statut: 'en_attente' | 'reussi' | 'echoue' | 'rembourse';
  transaction_id?: string;
  donnees_paiement?: any;
  paye_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  rendezVous?: RendezVous;
  patient?: Patient;
}

export interface Justificatif {
  id: number;
  rendez_vous_id: number;
  numero_justificatif: string;
  chemin_fichier: string;
  nom_fichier: string;
  qr_code?: string;
  envoye_email: boolean;
  genere_at: string;
  created_at: string;
  updated_at: string;
}

export interface StatistiquesPatient {
  total_rdv: number;
  rdv_confirmes: number;
  rdv_annules: number;
  rdv_termines: number;
  rdv_ce_mois: number;
  montant_total_depense: number;
  paiements_en_ligne: number;
  paiements_au_cabinet: number;
  specialites_consultees: number;
}

export interface StatistiquesMedecin {
  total_rdv: number;
  rdv_confirmes: number;
  rdv_en_attente: number;
  rdv_termines: number;
  rdv_ce_mois: number;
  rdv_semaine: number;
  rdv_aujourd_hui: number;
  revenus_mois: number;
  revenus_total: number;
  taux_confirmation: number;
  temps_moyen_consultation: number;
}

export interface NotificationPatient {
  type: 'rdv_proche' | 'paiement_attente';
  message: string;
  date?: string;
  count?: number;
}

export interface DashboardStats {
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

export interface CreneauDisponible {
  heure: string;
  disponible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ============= AUTHENTIFICATION =============
  login(credentials: { email: string; password: string }): Observable<ApiResponse<{ user: User; token: string }>> {
    return this.http.post<ApiResponse<{ user: User; token: string }>>(`${this.apiUrl}/login`, credentials);
  }

  register(userData: any): Observable<ApiResponse<{ user: User; token: string }>> {
    return this.http.post<ApiResponse<{ user: User; token: string }>>(`${this.apiUrl}/register`, userData);
  }

  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/logout`, {});
  }

  me(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`);
  }

  // ============= SPÉCIALITÉS =============
  getSpecialites(): Observable<ApiResponse<Specialite[]>> {
    return this.http.get<ApiResponse<Specialite[]>>(`${this.apiUrl}/specialites`);
  }

  // ============= MÉDECINS =============
  getMedecins(params: any = {}): Observable<ApiResponse<PaginatedResponse<Medecin>>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<PaginatedResponse<Medecin>>>(`${this.apiUrl}/medecins`, { params: httpParams });
  }

  getMedecin(id: number): Observable<ApiResponse<Medecin>> {
    return this.http.get<ApiResponse<Medecin>>(`${this.apiUrl}/medecins/${id}`);
  }

  // ============= RENDEZ-VOUS =============
  getRendezVous(id: number): Observable<ApiResponse<RendezVous>> {
    return this.http.get<ApiResponse<RendezVous>>(`${this.apiUrl}/rendez-vous/${id}`);
  }

  creerRendezVous(data: any): Observable<ApiResponse<RendezVous>> {
    return this.http.post<ApiResponse<RendezVous>>(`${this.apiUrl}/rendez-vous`, data);
  }

  confirmerRendezVous(id: number): Observable<ApiResponse<RendezVous>> {
    return this.http.post<ApiResponse<RendezVous>>(`${this.apiUrl}/rendez-vous/${id}/confirmer`, {});
  }

  annulerRendezVous(id: number): Observable<ApiResponse<RendezVous>> {
    return this.http.post<ApiResponse<RendezVous>>(`${this.apiUrl}/rendez-vous/${id}/annuler`, {});
  }

  terminerRendezVous(id: number): Observable<ApiResponse<RendezVous>> {
    return this.http.post<ApiResponse<RendezVous>>(`${this.apiUrl}/rendez-vous/${id}/terminer`, {});
  }

  getCreneauxDisponibles(medecinId: number, date: string): Observable<ApiResponse<CreneauDisponible[]>> {
    return this.http.get<ApiResponse<CreneauDisponible[]>>(`${this.apiUrl}/medecins/${medecinId}/creneaux?date=${date}`);
  }

  // ============= PATIENT =============
  getPatientRendezVous(params: any = {}): Observable<ApiResponse<PaginatedResponse<RendezVous>>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<PaginatedResponse<RendezVous>>>(`${this.apiUrl}/patient/rendez-vous`, { params: httpParams });
  }

  getPatientStatistiques(): Observable<ApiResponse<StatistiquesPatient>> {
    return this.http.get<ApiResponse<StatistiquesPatient>>(`${this.apiUrl}/patient/statistiques`);
  }

  getPatientNotifications(): Observable<ApiResponse<NotificationPatient[]>> {
    return this.http.get<ApiResponse<NotificationPatient[]>>(`${this.apiUrl}/patient/notifications`);
  }

  updatePatientProfil(data: any): Observable<ApiResponse<Patient>> {
    return this.http.put<ApiResponse<Patient>>(`${this.apiUrl}/patient/profil`, data);
  }

  // ============= MÉDECIN =============
  getMedecinRendezVous(params: any = {}): Observable<ApiResponse<PaginatedResponse<RendezVous>>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<PaginatedResponse<RendezVous>>>(`${this.apiUrl}/medecin/rendez-vous`, { params: httpParams });
  }

  getMedecinStatistiques(): Observable<ApiResponse<StatistiquesMedecin>> {
    return this.http.get<ApiResponse<StatistiquesMedecin>>(`${this.apiUrl}/medecin/statistiques`);
  }

  updateMedecinProfil(data: any): Observable<ApiResponse<Medecin>> {
    return this.http.put<ApiResponse<Medecin>>(`${this.apiUrl}/medecin/profil`, data);
  }

  updateMedecinDisponibilite(data: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/medecin/disponibilite`, data);
  }

  updateMedecinDisponibilites(data: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/medecin/disponibilites`, data);
  }

  // ============= PAIEMENTS =============
  creerPaiement(data: any): Observable<ApiResponse<{ client_secret: string; paiement_id: number }>> {
    return this.http.post<ApiResponse<{ client_secret: string; paiement_id: number }>>(`${this.apiUrl}/paiements`, data);
  }

  confirmerPaiement(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/paiements/${id}/confirmer`, {});
  }

  // ============= JUSTIFICATIFS =============
  genererJustificatif(rendezVousId: number): Observable<ApiResponse<{ download_url: string }>> {
    return this.http.post<ApiResponse<{ download_url: string }>>(`${this.apiUrl}/justificatifs/generer/${rendezVousId}`, {});
  }

  telechargerJustificatif(justificatifId: number): string {
    return `${this.apiUrl}/justificatifs/${justificatifId}/telecharger`;
  }

  // ============= ADMIN =============
  
  // Dashboard Admin
  getAdminDashboard(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.apiUrl}/admin/dashboard`);
  }

  // Gestion Utilisateurs
  getAdminUtilisateurs(params: any = {}): Observable<ApiResponse<PaginatedResponse<User>>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<PaginatedResponse<User>>>(`${this.apiUrl}/admin/utilisateurs`, { params: httpParams });
  }

  creerUtilisateur(data: any): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/admin/utilisateurs`, data);
  }

  modifierUtilisateur(id: number, data: any): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/admin/utilisateurs/${id}`, data);
  }

  supprimerUtilisateur(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/admin/utilisateurs/${id}`);
  }

  changerStatutUtilisateur(id: number, data: { statut: string; raison?: string }): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/admin/utilisateurs/${id}/statut`, data);
  }

  // Gestion Spécialités
  getAdminSpecialites(params: any = {}): Observable<ApiResponse<PaginatedResponse<Specialite>>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<PaginatedResponse<Specialite>>>(`${this.apiUrl}/admin/specialites`, { params: httpParams });
  }

  creerSpecialite(data: any): Observable<ApiResponse<Specialite>> {
    return this.http.post<ApiResponse<Specialite>>(`${this.apiUrl}/admin/specialites`, data);
  }

  modifierSpecialite(id: number, data: any): Observable<ApiResponse<Specialite>> {
    return this.http.put<ApiResponse<Specialite>>(`${this.apiUrl}/admin/specialites/${id}`, data);
  }

  supprimerSpecialite(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/admin/specialites/${id}`);
  }

  // Suivi Paiements
  getAdminPaiements(params: any = {}): Observable<ApiResponse<PaginatedResponse<Paiement>>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<PaginatedResponse<Paiement>>>(`${this.apiUrl}/admin/paiements`, { params: httpParams });
  }

  // Suivi Justificatifs
  getAdminJustificatifs(params: any = {}): Observable<ApiResponse<PaginatedResponse<Justificatif>>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<PaginatedResponse<Justificatif>>>(`${this.apiUrl}/admin/justificatifs`, { params: httpParams });
  }

  // Gestion Rendez-vous Admin
  getAdminRendezVous(params: any = {}): Observable<ApiResponse<PaginatedResponse<RendezVous>>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<PaginatedResponse<RendezVous>>>(`${this.apiUrl}/admin/rendez-vous`, { params: httpParams });
  }

  annulerRendezVousAdmin(id: number, data: { raison: string }): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/admin/rendez-vous/${id}/annuler`, data);
  }

  // Statistiques Générales
  getStatistiquesGenerales(params: any = {}): Observable<ApiResponse<any>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/admin/statistiques`, { params: httpParams });
  }

  // Génération de rapports
  genererRapport(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/admin/rapports`, data);
  }
}