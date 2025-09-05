// src/app/components/patient/paiement/paiement.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, RendezVous } from '../../../services/api.service';
import { environment } from '../../../../environments/environment';

declare var Stripe: any;

@Component({
  selector: 'app-paiement',
  templateUrl: './paiement.component.html',
  styleUrls: ['./paiement.component.scss']
})
export class PaiementComponent implements OnInit {
  rendezVous: RendezVous | null = null;
  paiementForm!: FormGroup;
  isLoading = true;
  isProcessing = false;
  
  stripe: any;
  elements: any;
  card: any;
  
  rdvId: number = 0;
  clientSecret: string = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.rdvId = Number(this.route.snapshot.paramMap.get('id'));
    this.initializeForm();
    this.loadRendezVous();
    this.initializeStripe();
  }

  private initializeForm(): void {
    this.paiementForm = this.fb.group({
      methode: ['stripe', Validators.required],
      accepteConditions: [false, Validators.requiredTrue]
    });
  }

  private loadRendezVous(): void {
    this.apiService.getRendezVous(this.rdvId).subscribe({
      next: (response) => {
        if (response.success) {
          this.rendezVous = response.data;
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Erreur chargement RDV:', error);
        this.snackBar.open('Erreur lors du chargement', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/dashboard/patient']);
      }
    });
  }

  private initializeStripe(): void {
    this.stripe = Stripe(environment.stripePublicKey);
    this.elements = this.stripe.elements();
    
    const style = {
      base: {
        color: '#424770',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#9e2146',
        iconColor: '#9e2146'
      }
    };

    this.card = this.elements.create('card', { style });
  }

  ngAfterViewInit(): void {
    if (this.card) {
      this.card.mount('#card-element');
      this.card.on('change', ({ error }: any) => {
        const displayError = document.getElementById('card-errors');
        if (displayError) {
          if (error) {
            displayError.textContent = error.message;
          } else {
            displayError.textContent = '';
          }
        }
      });
    }
  }

  onSubmit(): void {
    if (!this.paiementForm.valid || !this.rendezVous) {
      return;
    }

    this.isProcessing = true;

    // Créer le PaymentIntent
    this.apiService.creerPaiement({
      rendez_vous_id: this.rdvId,
      methode: 'stripe'
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.clientSecret = response.client_secret;
          this.confirmerPaiement();
        }
      },
      error: (error) => {
        this.isProcessing = false;
        this.snackBar.open('Erreur lors de la création du paiement', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private confirmerPaiement(): void {
    this.stripe.confirmCardPayment(this.clientSecret, {
      payment_method: {
        card: this.card,
        billing_details: {
          name: this.rendezVous?.patient?.user?.nom_complet || 'Patient'
        }
      }
    }).then((result: any) => {
      this.isProcessing = false;
      
      if (result.error) {
        this.snackBar.open(result.error.message, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      } else {
        // Paiement réussi
        this.snackBar.open('Paiement effectué avec succès !', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Rediriger vers les rendez-vous
        this.router.navigate(['/dashboard/patient/rendez-vous']);
      }
    });
  }

  retourner(): void {
    this.router.navigate(['/dashboard/patient/rendez-vous']);
  }

  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(prix);
  }
}