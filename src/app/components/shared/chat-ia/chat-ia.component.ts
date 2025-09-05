// src/app/components/shared/chat-ia/chat-ia.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../../services/auth.service';

interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chat-ia',
  templateUrl: './chat-ia.component.html',
  styleUrls: ['./chat-ia.component.scss']
})
export class ChatIaComponent implements OnInit, AfterViewChecked {
@ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  
  isOpen = false;
  isLoading = false;
  chatForm!: FormGroup;
  messages: ChatMessage[] = [];
  currentUser: User | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForm();
    this.initializeChat();
  }

  ngAfterViewChecked(): void {
    if (this.isOpen) {
      this.scrollToBottom();
    }
  }

  private initializeForm(): void {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  private initializeChat(): void {
    // Message de bienvenue
    const welcomeMessage: ChatMessage = {
      content: `Bonjour ${this.currentUser?.prenom || 'cher utilisateur'} ! Je suis votre assistant médical virtuel. Comment puis-je vous aider aujourd'hui ?`,
      isUser: false,
      timestamp: new Date()
    };
    this.messages.push(welcomeMessage);
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  closeChat(): void {
    this.isOpen = false;
  }

  clearChat(): void {
    this.messages = [];
    this.initializeChat();
  }

  onSubmit(): void {
    if (!this.chatForm.valid || this.isLoading) {
      return;
    }

    const userMessage = this.chatForm.get('message')?.value;
    if (!userMessage.trim()) {
      return;
    }

    // Ajouter le message de l'utilisateur
    const messageUtilisateur: ChatMessage = {
      content: userMessage,
      isUser: true,
      timestamp: new Date()
    };
    this.messages.push(messageUtilisateur);

    // Réinitialiser le formulaire
    this.chatForm.reset();

    // Simuler le traitement IA
    this.isLoading = true;
    
    setTimeout(() => {
      const reponseIA = this.genererReponseIA(userMessage);
      const messageIA: ChatMessage = {
        content: reponseIA,
        isUser: false,
        timestamp: new Date()
      };
      this.messages.push(messageIA);
      this.isLoading = false;
    }, 1500 + Math.random() * 1000); // Délai réaliste variable
  }

  private genererReponseIA(message: string): string {
    const messageLower = message.toLowerCase();
    
    // Réponses contextuelles selon le rôle de l'utilisateur
    if (this.currentUser?.role === 'patient') {
      return this.genererReponsePatient(messageLower);
    } else if (this.currentUser?.role === 'medecin') {
      return this.genererReponseMedecin(messageLower);
    } else if (this.currentUser?.role === 'admin') {
      return this.genererReponseAdmin(messageLower);
    }
    
    return this.genererReponseGenerale(messageLower);
  }

  private genererReponsePatient(message: string): string {
    // Symptômes et santé
    if (message.includes('douleur') || message.includes('mal')) {
      return "Je comprends que vous ressentez une douleur. Bien que je puisse vous donner des informations générales, il est important de consulter un médecin pour un diagnostic approprié. Vous pouvez rechercher un spécialiste sur notre plateforme selon votre symptôme.";
    }
    
    if (message.includes('fièvre') || message.includes('température')) {
      return "La fièvre peut avoir plusieurs causes. Si elle persiste ou s'accompagne d'autres symptômes, consultez rapidement un médecin. En attendant, restez hydraté et reposez-vous.";
    }
    
    if (message.includes('toux') || message.includes('rhume')) {
      return "Pour une toux ou un rhume, pensez à vous hydrater, vous reposer et consulter un médecin si les symptômes persistent plus de quelques jours ou s'aggravent.";
    }

    // Rendez-vous
    if (message.includes('rendez-vous') || message.includes('rdv') || message.includes('consultation')) {
      return "Pour prendre un rendez-vous, allez dans la section 'Rechercher un médecin', choisissez votre spécialiste et sélectionnez un créneau disponible. Vous pouvez filtrer par spécialité et localisation.";
    }

    if (message.includes('annuler') || message.includes('modifier')) {
      return "Vous pouvez gérer vos rendez-vous dans la section 'Mes rendez-vous'. L'annulation est possible jusqu'à 24h avant le rendez-vous.";
    }

    if (message.includes('paiement') || message.includes('payer')) {
      return "Vous pouvez payer en ligne ou directement au cabinet selon les préférences du médecin. Les paiements en ligne sont sécurisés par Stripe.";
    }

    // Urgences
    if (message.includes('urgence') || message.includes('urgent') || message.includes('grave')) {
      return "⚠️ En cas d'urgence médicale, contactez immédiatement les services d'urgence (SAMU: 1515) ou rendez-vous aux urgences les plus proches. Cette plateforme n'est pas adaptée aux urgences.";
    }

    return "En tant que patient, je peux vous aider avec vos rendez-vous, vous orienter vers les bonnes spécialités, ou répondre à des questions générales sur la santé. Comment puis-je vous assister ?";
  }

  private genererReponseMedecin(message: string): string {
    if (message.includes('patient') || message.includes('consultation')) {
      return "Vous pouvez gérer vos patients et consultations dans votre tableau de bord. N'hésitez pas si vous avez des questions sur l'interface ou la gestion de votre planning.";
    }

    if (message.includes('horaire') || message.includes('disponibilité')) {
      return "Vos horaires se configurent dans la section 'Horaires'. Vous pouvez définir vos créneaux par jour et la durée de vos consultations.";
    }

    if (message.includes('tarif') || message.includes('prix')) {
      return "Vous pouvez ajuster vos tarifs dans votre profil médecin. Les patients verront le prix avant de prendre rendez-vous.";
    }

    return "En tant que médecin, je peux vous aider avec la gestion de votre planning, vos tarifs, ou l'utilisation de la plateforme. Que souhaitez-vous savoir ?";
  }

  private genererReponseAdmin(message: string): string {
    if (message.includes('utilisateur') || message.includes('compte')) {
      return "Vous pouvez gérer tous les utilisateurs depuis votre panel d'administration. Création, modification et gestion des statuts sont disponibles.";
    }

    if (message.includes('statistique') || message.includes('rapport')) {
      return "Les statistiques détaillées et la génération de rapports sont accessibles dans votre section 'Statistiques'. Vous pouvez exporter les données en CSV ou JSON.";
    }

    if (message.includes('spécialité')) {
      return "La gestion des spécialités médicales se fait dans la section dédiée. Vous pouvez créer, modifier et désactiver les spécialités.";
    }

    return "En tant qu'administrateur, je peux vous aider avec la gestion des utilisateurs, des statistiques, des spécialités ou toute question technique sur la plateforme.";
  }

  private genererReponseGenerale(message: string): string {
    // Salutations
    if (message.includes('bonjour') || message.includes('salut') || message.includes('hello')) {
      return "Bonjour ! Je suis là pour vous aider avec toutes vos questions concernant la plateforme médicale. Comment puis-je vous assister ?";
    }

    if (message.includes('merci') || message.includes('remercie')) {
      return "Je vous en prie ! N'hésitez pas si vous avez d'autres questions.";
    }

    // Questions sur la plateforme
    if (message.includes('comment') && message.includes('marche')) {
      return "Notre plateforme permet de prendre facilement des rendez-vous médicaux en ligne. Les patients recherchent des médecins par spécialité, prennent rendez-vous et peuvent payer en ligne de manière sécurisée.";
    }

    if (message.includes('sécurité') || message.includes('données')) {
      return "Vos données sont protégées selon les standards les plus élevés. Nous respectons le RGPD et toutes les informations médicales sont chiffrées et sécurisées.";
    }

    // Questions techniques
    if (message.includes('problème') || message.includes('erreur') || message.includes('bug')) {
      return "Si vous rencontrez un problème technique, vous pouvez nous contacter via le support ou réessayer. La plupart des problèmes se resolvent en actualisant la page.";
    }

    // Réponse par défaut
    return "Je suis là pour vous aider ! Vous pouvez me poser des questions sur la prise de rendez-vous, les paiements, votre profil, ou tout aspect de la plateforme médicale.";
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Erreur scroll:', err);
    }
  }
}