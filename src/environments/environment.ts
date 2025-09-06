// src/environments/environment.ts - VERSION OPTIMISÉE
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  
  // 🔑 CLÉS STRIPE - OBLIGATOIRES POUR LE PAIEMENT
  stripePublicKey: 'pk_test_51S1vALReXhRDkz4r911ND4Ys1FrBBTFnuGN7J27UgiMCqw8haa8Ed5fDTMN2CKm3Zn1eezbafp47t1yeYSVXjMRj00n4p53BkU',
  
  // 🚀 OPTIMISATIONS STRIPE
  stripe: {
    // Précharger Stripe dès le démarrage de l'app
    preload: true,
    // Timeout pour le chargement (ms)
    loadTimeout: 1000,
    // Retry automatique en cas d'échec
    retryOnFailure: true,
    // Nombre de tentatives max
    maxRetries: 3
  },
  
  // 🔧 CONFIGURATION DEBUG
  debug: {
    // Activer les logs détaillés en dev
    enableLogging: true,
    // Afficher les cartes de test
    showTestCards: true,
    // Simulation de lenteur réseau (ms) - 0 pour désactiver
    networkDelay: 0
  },
  
  // 🎯 CONFIGURATION API
  api: {
    // Timeout pour les requêtes API (ms)
    timeout: 3000,
    // Retry automatique pour les requêtes échouées
    enableRetry: true,
    // Délai entre les tentatives (ms)
    retryDelay: 1000
  }
};

// 🏭 Configuration pour la production
export const environmentProd = {
  production: true,
  apiUrl: 'https://votre-domaine.com/api',
  
  // 🔑 CLÉS STRIPE LIVE - À REMPLACER POUR LA PRODUCTION
  stripePublicKey: 'pk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  
  stripe: {
    preload: true,
    loadTimeout: 15000, // Plus de temps en prod
    retryOnFailure: true,
    maxRetries: 5
  },
  
  debug: {
    enableLogging: false, // Désactiver en production
    showTestCards: false, // Jamais en production
    networkDelay: 0
  },
  
  api: {
    timeout: 45000, // Plus de temps en prod
    enableRetry: true,
    retryDelay: 2000
  }
};

// 🔍 VALIDATION DE LA CONFIGURATION
export function validateEnvironment() {
  const errors: string[] = [];
  
  // Vérifier la clé Stripe
  if (!environment.stripePublicKey || environment.stripePublicKey === 'pk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
    errors.push('❌ Clé publique Stripe manquante ou non configurée');
  }
  
  if (!environment.stripePublicKey.startsWith('pk_')) {
    errors.push('❌ Clé publique Stripe invalide (doit commencer par pk_)');
  }
  
  // Vérifier l'URL API
  if (!environment.apiUrl) {
    errors.push('❌ URL API manquante');
  }
  
  // Afficher les erreurs
  if (errors.length > 0) {
    console.error('🚨 ERREURS DE CONFIGURATION:');
    errors.forEach(error => console.error(error));
    console.error('📝 Vérifiez votre fichier environment.ts');
    return false;
  }
  
  console.log('✅ Configuration environment validée');
  return true;
}

// 🚀 AIDE POUR LA CONFIGURATION
export const STRIPE_SETUP_HELP = {
  testKey: {
    description: '🧪 Clé de test Stripe (développement)',
    format: 'pk_test_...',
    source: 'https://dashboard.stripe.com/test/apikeys'
  },
  liveKey: {
    description: '🔴 Clé live Stripe (production)',
    format: 'pk_live_...',
    source: 'https://dashboard.stripe.com/apikeys',
    warning: '⚠️ À utiliser UNIQUEMENT en production'
  },
  webhookUrl: {
    description: '🔗 URL webhook pour Stripe',
    dev: 'http://localhost:8000/api/stripe/webhook',
    prod: 'https://votre-domaine.com/api/stripe/webhook'
  }
};

// 🛠️ UTILITAIRES POUR LE DEBUG
export function logEnvironmentInfo() {
  if (environment.debug.enableLogging) {
    console.group('🔧 Configuration Environment');
    console.log('Production:', environment.production);
    console.log('API URL:', environment.apiUrl);
    console.log('Stripe Key:', environment.stripePublicKey ? '✅ Configurée' : '❌ Manquante');
    console.log('Debug Mode:', environment.debug.enableLogging);
    console.groupEnd();
  }
}