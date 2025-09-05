// src/environments/environment.ts - CONFIGURATION STRIPE AVEC CARTES DE TEST

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  
  // ===== CONFIGURATION STRIPE =====
  stripePublicKey: 'pk_test_51S1vALReXhRDkz4r911ND4Ys1FrBBTFnuGN7J27UgiMCqw8haa8Ed5fDTMN2CKm3Zn1eezbafp47t1yeYSVXjMRj00n4p53BkU', // À remplacer par votre vraie clé
  
  // CARTES DE TEST STRIPE RECOMMANDÉES
  stripeTestCards: {
    // Cartes qui RÉUSSISSENT toujours
    success: {
      visa: '4242424242424242',
      visaDebit: '4000056655665556',
      mastercard: '5555555555554444',
      americanExpress: '378282246310005',
      discover: '6011111111111117'
    },
    
    // Cartes qui ÉCHOUENT avec différents codes d'erreur
    declined: {
      generic: '4000000000000002',           // generic_decline
      insufficientFunds: '4000000000009995', // insufficient_funds
      lostCard: '4000000000009987',          // lost_card
      stolenCard: '4000000000009979',        // stolen_card
      expiredCard: '4000000000000069',       // expired_card
      incorrectCvc: '4000000000000127',      // incorrect_cvc
      processingError: '4000000000000119',   // processing_error
      incorrectNumber: '4242424242424241'    // incorrect_number
    },
    
    // Cartes nécessitant une authentification 3D Secure
    require3DS: {
      always: '4000002500003155',    // Toujours demander 3DS
      ifSetup: '4000002760003184'     // 3DS si configuré
    }
  }
};

// ===== NOTES D'UTILISATION =====
/*
CARTES DE TEST STRIPE - GUIDE D'UTILISATION

1. CARTES QUI RÉUSSISSENT TOUJOURS :
   - 4242 4242 4242 4242 (Visa)
   - 5555 5555 5555 4444 (Mastercard)
   - Utilisez n'importe quelle date future pour l'expiration
   - Utilisez n'importe quel CVC à 3 chiffres

2. CARTES QUI ÉCHOUENT :
   - 4000 0000 0000 0002 : Carte refusée (generic_decline)
   - 4000 0000 0000 9995 : Fonds insuffisants
   - 4000 0000 0000 0069 : Carte expirée

3. POUR TESTER LES ERREURS :
   - Utilisez les cartes "declined" pour tester les différents types d'erreurs
   - Vérifiez que votre interface gère correctement chaque type d'erreur

4. CONFIGURATION ENVIRONNEMENT :
   - Remplacez 'pk_test_votre_cle_publique_test' par votre vraie clé publique de test
   - En production, utilisez environment.prod.ts avec les clés live

5. MONTANTS DE TEST :
   - Tous les montants en mode test fonctionnent
   - Les paiements de test n'ont pas d'impact financier réel

6. 3D SECURE :
   - 4000 0025 0000 3155 : Déclenche toujours l'authentification 3D Secure
   - Utilisez "fail" comme mot de passe pour échouer l'authentification
   - Utilisez n'importe quoi d'autre pour réussir

7. WEBHOOKS (optionnel) :
   - Configurez les webhooks Stripe pour recevoir les événements
   - Endpoint recommandé : /api/stripe/webhook
*/