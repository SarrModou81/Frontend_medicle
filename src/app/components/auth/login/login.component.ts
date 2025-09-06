// src/app/components/auth/login/login.component.ts - CORRIGÉ
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  returnUrl = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Si l'utilisateur est déjà connecté, le rediriger
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.redirectBasedOnRole(user.role);
        return;
      }
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Récupérer l'URL de retour
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      console.log('Tentative de connexion avec:', this.loginForm.value);
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          console.log('Réponse login reçue:', response);
          this.isLoading = false;
          
          if (response.success) {
            console.log('Login success, affichage snackbar');
            
            this.snackBar.open('Connexion réussie !', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // CORRECTION FORCÉE : Sauvegarde manuelle et redirection
            console.log('Début correction forcée - sauvegarde et redirection');
            
            // Forcer la sauvegarde du token et utilisateur
            if (response.token && response.user) {
              console.log('Sauvegarde forcée du token et utilisateur');
              localStorage.setItem('auth_token', response.token);
              localStorage.setItem('auth_user', JSON.stringify(response.user));
              
              // Vérification immédiate
              const savedToken = localStorage.getItem('auth_token');
              const savedUser = localStorage.getItem('auth_user');
              console.log('Vérification sauvegarde - Token:', !!savedToken, 'User:', !!savedUser);
              
              // Redirection forcée avec délai
              setTimeout(() => {
                console.log('Redirection forcée vers:', response.user.role);
                
                if (this.returnUrl) {
                  console.log('Redirection vers returnUrl:', this.returnUrl);
                  this.router.navigateByUrl(this.returnUrl);
                } else {
                  this.redirectBasedOnRole(response.user.role);
                }
              }, 500); // Délai de 500ms pour s'assurer que tout est sauvé
            } else {
              console.error('Token ou utilisateur manquant dans la réponse');
              this.snackBar.open('Erreur de sauvegarde des données de connexion', 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
          }
        },
        error: (error) => {
          console.error('Erreur login:', error);
          this.isLoading = false;
          const errorMessage = error.error?.message || 'Erreur lors de la connexion';
          this.snackBar.open(errorMessage, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

// SOLUTION TEMPORAIRE - Modifiez la méthode redirectBasedOnRole dans login.component.ts

private redirectBasedOnRole(role: string): void {
  console.log('redirectBasedOnRole appelée avec le rôle:', role);
  
  // SOLUTION TEMPORAIRE : Navigation directe sans vérification des guards
  console.log('🚀 SOLUTION TEMPORAIRE - Navigation forcée sans guards');
  
  switch (role) {
    case 'patient':
      console.log('Redirection vers dashboard patient');
      // Essayer d'abord la route complète, puis une alternative
      this.router.navigateByUrl('/dashboard/patient').then(success => {
        console.log('Navigation patient réussie:', success);
        if (!success) {
          console.log('Échec navigation /dashboard/patient, essai alternative');
          // Charger directement le composant ou une route alternative
          window.location.href = '/dashboard/patient';
        }
      }).catch(error => {
        console.error('Erreur navigation patient:', error);
        // En cas d'échec total, redirection manuelle
        window.location.href = '/dashboard/patient';
      });
      break;
      
    case 'medecin':
      console.log('Redirection vers dashboard médecin');
      this.router.navigateByUrl('/dashboard/medecin').then(success => {
        console.log('Navigation médecin réussie:', success);
        if (!success) {
          console.log('Échec navigation /dashboard/medecin, essai alternative');
          window.location.href = '/dashboard/medecin';
        }
      }).catch(error => {
        console.error('Erreur navigation médecin:', error);
        window.location.href = '/dashboard/medecin';
      });
      break;
      
    case 'admin':
      console.log('Redirection vers dashboard admin');
      this.router.navigateByUrl('/dashboard/admin').then(success => {
        console.log('Navigation admin réussie:', success);
        if (!success) {
          console.log('Échec navigation /dashboard/admin, essai alternative');
          // Test avec une navigation step-by-step
          this.router.navigate(['dashboard', 'admin']).then(success2 => {
            console.log('Navigation admin alternative réussie:', success2);
            if (!success2) {
              // Dernière option : redirection manuelle
              console.log('Redirection manuelle vers admin dashboard');
              window.location.href = '/dashboard/admin';
            }
          });
        }
      }).catch(error => {
        console.error('Erreur navigation admin:', error);
        window.location.href = '/dashboard/admin';
      });
      break;
      
    default:
      console.log('Rôle non reconnu, redirection vers dashboard général');
      this.router.navigateByUrl('/dashboard').then(success => {
        console.log('Navigation dashboard général réussie:', success);
        if (!success) {
          window.location.href = '/dashboard';
        }
      }).catch(error => {
        console.error('Erreur navigation dashboard général:', error);
        window.location.href = '/dashboard';
      });
      break;
  }
}

  // MÉTHODES DE TEST AJOUTÉES
  loginWithDemo(role: 'patient' | 'medecin' | 'admin'): void {
    this.isLoading = true;
    
    const credentials = {
      'patient': { email: 'aminata.ndiaye@email.sn', password: 'patient123' },
      'medecin': { email: 'dr.ousmane.ba@medical.sn', password: 'medecin123' },
      'admin': { email: 'admin@medical.sn', password: 'admin123' }
    };

    console.log(`Connexion démo ${role} avec:`, credentials[role]);

    this.authService.login(credentials[role]).subscribe({
      next: (response) => {
        console.log('Réponse login démo reçue:', response);
        this.isLoading = false;
        
        if (response.success) {
          this.snackBar.open(`Connexion ${role} réussie !`, 'Fermer', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });

          // Sauvegarde forcée
          if (response.token && response.user) {
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('auth_user', JSON.stringify(response.user));
            
            // Redirection immédiate
            setTimeout(() => {
              this.redirectBasedOnRole(role);
            }, 300);
          }
        }
      },
      error: (error) => {
        console.error('Erreur login démo:', error);
        this.isLoading = false;
        this.snackBar.open('Erreur de connexion démo', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    
    if (control?.hasError('required')) {
      return `Le champ ${field} est obligatoire`;
    }
    
    if (control?.hasError('email')) {
      return 'Veuillez entrer une adresse email valide';
    }
    
    if (control?.hasError('minlength')) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    return '';
  }
}