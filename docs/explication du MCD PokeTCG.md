explication du MCD PokeTCG :

un dresseur a un unique portefeuille

Sur le trait côté DRESSEUR :0,1

Explication  : "Lorsqu'un dresseur crée son compte, il n'a pas encore de portefeuille. Celui-ci est généré une seconde après par le microservice Wallet."



Sur le trait côté PORTEFEUILLE :1,1

Explication : Un portefeuille appartient à un seul et unique dresseur. Il ne peut pas être partagé.



&#x20;le Vendeur à son Annonce ou plusieur mais annonce peut appartenir qu a un seul dresseur 



Cardinalité côté DRESSEUR : 0,n

Explication : Un dresseur peut ne rien vendre (0) ou vendre plein de cartes (n)



Cardinalité côté ANNONCE : 1,1

Explication : Une annonce appartient obligatoirement à un seul et unique vendeur.

&#x20;

Relier l'Acheteur à sa Transaction

Cardinalité côté DRESSEUR : 0,n

Explication : Un dresseur peut n'avoir jamais rien acheté (0) ou avoir fait plein d'achats (n).



Cardinalité côté TRANSACTION : 1,1

Explication : Une transaction est obligatoirement effectuée par un seul acheteur.



Relier l'Annonce à la Transaction

Cardinalité côté ANNONCE : 0,1

Explication : Une annonce peut rester sans acheteur (0) ou aboutir à une seule transaction (1)

Cardinalité côté TRANSACTION : 1,1

Explication : Une transaction concerne forcément une annonce précise.



relier le DRESSEUR et la CARTE

pour l association(rond bleu) on ajouter etat de carte la langue et la date on a mis ces info car Une carte Dracaufeu a toujours le même nom et la même image. Par contre, l'état (neuf ou abîmé) et la langue dépendent de chaque dresseur. C'est donc une information propre à la relation entre le dresseur et la carte



Cardinalité côté **DRESSEUR : 0,n** 

Explication :Un dresseur peut avoir 0 ou plusieurs cartes

Cardinalité côté **CARTE : 0,n**

Explication :Une référence de carte peut être possédée par 0 ou plusieurs dresseurs



Lien Dresseur -> Topic

Cardinalités : DRESSEUR (0,n) <---> TOPIC (1,1)

Explication :Un dresseur crée 0 ou plusieurs sujets, mais un sujet est créé par 1 seul dresseur.

Cardinalités : DRESSEUR (0,n) <---> MESSAGE (1,1)

Explication :Un dresseur poste 0 ou plusieurs messages, mais un message est posté par 1 seul dresseur.



lien dresseur -> NEWS

Cardinalités : DRESSEUR (0,n) <---> NEWS (1,1)

Explication : Un Admin (qui est un dresseur) publie des news. Une news est publiée par un seul Admin.



2\. RÉSUMÉ DE LA PHASE DE CONCEPTION (À garder précieusement)



Voici la synthèse de tout ce que nous avons accompli ensemble. Copie ce texte dans un bloc-notes, il te servira de base pour ton dossier professionnel et ton discours oral.

ÉTAPE 1 : Définition de la Vision (Idéation)



&#x20;   Projet : PokeTCG.



&#x20;   Concept : Marketplace sécurisée et Pokedex numérique pour collectionneurs Pokémon.



&#x20;   Innovation : Architecture Microservices (Java/Spring Boot) et Persistance Polyglotte (MySQL pour la finance, MongoDB pour le catalogue).



ÉTAPE 2 : Analyse Agile (Miro - User Story Map)



&#x20;   Méthodologie : Découpage du parcours utilisateur en "User Stories".



&#x20;   Organisation : Planification en 3 étapes (Release 1 : MVP indispensable pour l'examen / Releases 2 \& 3 : Évolutions futures).



&#x20;   Résultat : Un visuel clair montrant la priorité des fonctionnalités (Authentification, Wallet, Pokedex, Market, Social).



ÉTAPE 3 : Rédaction du Cahier des Charges (Notion - 17 pages)



&#x20;   Structure : Document de référence complet définissant les besoins fonctionnels et les contraintes techniques.



&#x20;   Points clés : Analyse MoSCoW, spécifications de sécurité (JWT/BCrypt), conformité RGPD, et processus métier détaillés (Vente, Échange, Séquestre).



ÉTAPE 4 : Modélisation des Données (Looping - MCD/MLD)



&#x20;   Approche : Utilisation de la méthode Merise.



&#x20;   MCD : Identification des entités (Dresseur, Carte, Transaction, etc.) et des associations.



&#x20;   MLD : Transformation logique incluant les Clés Étrangères (Foreign Keys) et création d'une table de liaison pour le Pokedex personnel.



ÉTAPE 5 : Schéma Physique (MySQL Workbench)



&#x20;   Réalisation : Création du plan technique précis de la base de données transactionnelle.



&#x20;   Technique : Définition des types de données (Decimal pour l'argent, VARCHAR, DATETIME) et mise en place de l'intégrité référentielle.



ÉTAPE 6 : Gestion de Projet (GitHub Project)



&#x20;   Outils : Création du Repository PokeTCG et configuration du tableau Kanban.



&#x20;   Contrôle : Transformation des besoins en 12 tickets techniques (Issues) avec checklists détaillées pour piloter le développement.







&#x20;



