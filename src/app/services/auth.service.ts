// src/app/services/auth.service.ts - CORRECTION POUR LARAVEL SANCTUM
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
  ) {
    console.log('🔧 AuthService - Initialisation');
    this.loadUserFromStorage();
  }

  /**
   * Connexion utilisateur
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('🔐 AuthService.login - Début avec:', credentials);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('🔐 AuthService.login - Réponse reçue:', response);
          
          if (response.success) {
            console.log('🔐 AuthService.login - Succès, sauvegarde des données');
            this.setAuthData(response.token, response.user);
            console.log('🔐 AuthService.login - Données sauvegardées');
            
            // Vérification immédiate
            const savedToken = this.getToken();
            const savedUser = this.getCurrentUser();
            console.log('🔐 AuthService.login - Vérification: Token:', !!savedToken, 'User:', !!savedUser);
          } else {
            console.log('❌ AuthService.login - Échec de connexion');
          }
        })
      );
  }

  /**
   * Inscription utilisateur
   */
  register(userData: any): Observable<AuthResponse> {
    console.log('📝 AuthService.register - Début avec:', userData);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          console.log('📝 AuthService.register - Réponse reçue:', response);
          
          if (response.success) {
            console.log('📝 AuthService.register - Succès, sauvegarde des données');
            this.setAuthData(response.token, response.user);
            console.log('📝 AuthService.register - Données sauvegardées');
            
            // Vérification immédiate
            const savedToken = this.getToken();
            const savedUser = this.getCurrentUser();
            console.log('📝 AuthService.register - Vérification: Token:', !!savedToken, 'User:', !!savedUser);
          } else {
            console.log('❌ AuthService.register - Échec d\'inscription');
          }
        })
      );
  }

  /**
   * Vérifier si l'utilisateur est connecté
   * CORRECTION : Pour Laravel Sanctum, on ne vérifie pas l'expiration côté client
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    // CORRECTION : Pas de vérification d'expiration pour Laravel Sanctum
    const isAuth = !!token && !!user;
    
    console.log('🔍 AuthService.isAuthenticated - Token:', !!token, 'User:', !!user, 'Résultat:', isAuth);
    
    return isAuth;
  }

  /**
   * Récupérer le token
   */
  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    console.log('🎫 AuthService.getToken - Token récupéré:', !!token);
    return token;
  }

  /**
   * Récupérer l'utilisateur actuel depuis le localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('👤 AuthService.getCurrentUser - Utilisateur récupéré:', !!user, user?.role);
    return user;
  }

  /**
   * Vérifier si l'utilisateur a le rôle requis
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    const hasRole = user ? user.role === role : false;
    console.log('🎭 AuthService.hasRole - Rôle demandé:', role, 'Utilisateur a le rôle:', hasRole);
    return hasRole;
  }

  /**
   * Vérifier si l'utilisateur a l'un des rôles requis
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    const hasAnyRole = user ? roles.includes(user.role) : false;
    console.log('🎭 AuthService.hasAnyRole - Rôles demandés:', roles, 'Rôle utilisateur:', user?.role, 'Résultat:', hasAnyRole);
    return hasAnyRole;
  }

  /**
   * Sauvegarder les données d'authentification
   */
  private setAuthData(token: string, user: User): void {
    console.log('💾 AuthService.setAuthData - Début sauvegarde');
    console.log('💾 Token à sauvegarder:', !!token);
    console.log('💾 Utilisateur à sauvegarder:', user);
    
    try {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(user));
      this.currentUserSubject.next(user);
      
      console.log('✅ AuthService.setAuthData - Sauvegarde réussie');
      
      // Vérification immédiate
      const savedToken = localStorage.getItem(this.tokenKey);
      const savedUserStr = localStorage.getItem(this.userKey);
      console.log('🔍 AuthService.setAuthData - Vérification immédiate:');
      console.log('   - Token sauvé:', !!savedToken);
      console.log('   - User sauvé:', !!savedUserStr);
      
    } catch (error) {
      console.error('❌ AuthService.setAuthData - Erreur de sauvegarde:', error);
    }
  }

  /**
   * Charger l'utilisateur depuis le localStorage
   */
  private loadUserFromStorage(): void {
    console.log('📂 AuthService.loadUserFromStorage - Chargement des données');
    
    const token = localStorage.getItem(this.tokenKey);
    const userStr = localStorage.getItem(this.userKey);
    
    console.log('📂 loadUserFromStorage - Token trouvé:', !!token);
    console.log('📂 loadUserFromStorage - User trouvé:', !!userStr);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        console.log('✅ loadUserFromStorage - Données chargées avec succès');
      } catch (error) {
        console.error('❌ loadUserFromStorage - Erreur parsing user:', error);
        this.clearAuthData();
      }
    } else {
      console.log('📂 loadUserFromStorage - Aucune donnée trouvée');
    }
  }

  /**
   * Supprimer les données d'authentification
   */
  private clearAuthData(): void {
    console.log('🗑️ AuthService.clearAuthData - Suppression des données');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  /**
   * Déconnexion
   */
  logout(): Observable<any> {
    console.log('🚪 AuthService.logout - Déconnexion');
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
   * Rediriger après connexion selon le rôle
   */
  redirectAfterLogin(role: string): void {
    console.log('🔄 AuthService.redirectAfterLogin - Rôle:', role);
    
    switch (role) {
      case 'patient':
        console.log('🔄 Redirection vers patient dashboard');
        this.router.navigate(['/dashboard/patient']);
        break;
      case 'medecin':
        console.log('🔄 Redirection vers médecin dashboard');
        this.router.navigate(['/dashboard/medecin']);
        break;
      case 'admin':
        console.log('🔄 Redirection vers admin dashboard');
        this.router.navigate(['/dashboard/admin']);
        break;
      default:
        console.log('🔄 Rôle non reconnu, redirection vers dashboard général');
        this.router.navigate(['/dashboard']);
        break;
    }
  }

  /**
   * Rafraîchir les données utilisateur depuis le serveur
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

  /**
   * Récupérer les informations utilisateur courantes depuis le serveur
   */
  me(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`)
      .pipe(
        tap(response => {
          if (response.success) {
            const user = response.user || response.data;
            if (user) {
              this.setUser(user);
            }
          }
        })
      );
  }

  /**
   * Mettre à jour les informations utilisateur
   */
  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}