// src/app/services/auth.service.ts - VERSION CORRIGÉE
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'patient' | 'medecin' | 'admin';
  statut: 'actif' | 'inactif' | 'suspendu';
  telephone?: string;
  adresse?: string;
  patient?: any;
  medecin?: any;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  password_confirmation: string;
  telephone?: string;
  adresse?: string;
  role?: 'patient' | 'medecin';
  
  // Champs spécifiques patient
  date_naissance?: string;
  sexe?: 'M' | 'F';
  
  // Champs spécifiques médecin
  specialite_id?: number;
  numero_ordre?: string;
  prix_consultation?: number;
}

export interface MeResponse {
  success: boolean;
  user: User;
  data?: User; // Pour compatibilité avec ApiResponse
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Connexion utilisateur
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.token, response.user);
          }
        })
      );
  }

  /**
   * Inscription utilisateur
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.token, response.user);
          }
        })
      );
  }

  /**
   * Déconnexion
   */
  logout(): Observable<any> {
    const token = this.getToken();
    
    if (token) {
      return this.http.post(`${this.apiUrl}/logout`, {})
        .pipe(
          tap(() => {
            this.clearAuthData();
          })
        );
    } else {
      this.clearAuthData();
      return of(null);
    }
  }

  /**
   * Récupérer les informations utilisateur courantes
   */
  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/me`)
      .pipe(
        tap(response => {
          if (response.success) {
            // Gérer les deux formats de réponse possibles
            const user = response.user || response.data;
            if (user) {
              this.setUser(user);
            }
          }
        })
      );
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Récupérer le token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Récupérer l'utilisateur actuel depuis le localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Vérifier si l'utilisateur a le rôle requis
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  /**
   * Vérifier si l'utilisateur a l'un des rôles requis
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Sauvegarder les données d'authentification
   */
  private setAuthData(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Mettre à jour les informations utilisateur
   */
  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Supprimer les données d'authentification
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  /**
   * Vérifier si le token est expiré
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Rediriger après connexion selon le rôle
   */
  redirectAfterLogin(role: string): void {
    switch (role) {
      case 'patient':
        this.router.navigate(['/dashboard/patient']);
        break;
      case 'medecin':
        this.router.navigate(['/dashboard/medecin']);
        break;
      case 'admin':
        this.router.navigate(['/dashboard/admin']);
        break;
      default:
        this.router.navigate(['/dashboard']);
        break;
    }
  }

  /**
   * Rafraîchir les données utilisateur
   */
  refreshUser(): void {
    if (!this.isAuthenticated()) {
      return;
    }

    this.me().subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Données utilisateur mises à jour');
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour des données utilisateur:', error);
        if (error.status === 401) {
          this.clearAuthData();
          this.router.navigate(['/login']);
        }
      }
    });
  }
}