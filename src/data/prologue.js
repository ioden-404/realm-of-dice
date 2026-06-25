export const PROLOGUE = {
  id: 'prologue',
  title: 'Nulle Part',
  startSequence: 'seq1-voices',
  sequences: {
    'seq1-voices': {
      id: 'seq1-voices',
      blocks: [
        {
          type: 'narration',
          lines: [
            "Noir complet. Pas le noir de la nuit. Le noir d'avant les choses. Celui où même le silence a une texture.",
            "Puis, comme un souffle à travers un mur :"
          ]
        },
        {
          type: 'dialogue',
          speaker: null,
          text: "...un nom..."
        },
        {
          type: 'narration',
          lines: [
            "La voix n'a pas de direction. Elle vient de partout. De nulle part. Elle est vieille. Pas comme une personne âgée, vieille comme de la pierre usée par des siècles de pluie.",
          ]
        },
        {
          type: 'dialogue',
          speaker: null,
          text: "...il manque un nom..."
        },
        {
          type: 'narration',
          lines: [
            "Tu ouvres les yeux.",
            "Ta chambre. Les poutres basses du plafond que tu connais par cœur, chaque nœud dans le bois, chaque fissure. La couverture rugueuse sur tes jambes. La lueur de la lune à travers les volets mal joints.",
            "C'est la quatrième nuit."
          ]
        },
        {
          type: 'choice',
          id: 'temperament',
          options: [
            {
              label: '"Encore ce rêve..."',
              description: "Tu te frottes le visage, les paumes contre les yeux, comme pour effacer quelque chose derrière tes paupières.",
              setValue: { key: 'temperament', value: 'resigne' }
            },
            {
              label: '"Qui est là ?"',
              description: "Tu scrutes les coins de la pièce. Les ombres ont la forme qu'elles ont toujours eue. Rien n'a bougé. Rien ne bouge jamais à Nulle Part.",
              setValue: { key: 'temperament', value: 'mefiant' }
            },
            {
              label: '"..."',
              description: "Tu restes immobile. Tu écoutes. Le bois craque. Le vent dehors. Et en dessous, très loin en dessous, quelque chose d'autre.",
              setValue: { key: 'temperament', value: 'silencieux' }
            }
          ]
        },
        {
          type: 'narration',
          lines: [
            "Le silence revient. Tu crois que c'est fini. Tu fermes les yeux."
          ]
        },
        {
          type: 'dialogue',
          speaker: null,
          text: "...le tien... il manque..."
        },
        {
          type: 'narration',
          lines: [
            "Cette fois c'est plus proche. Pas dans ta tête. Dans le sol. Sous le plancher, sous les fondations de ta maison, quelque chose t'appelle avec une voix qui ressemble à la tienne quand tu parles dans un puits.",
            "Et tu sens une direction. Pas avec tes yeux, pas avec tes oreilles. Avec quelque chose de plus ancien que ça. Un aimant dans ta poitrine qui tire vers le bas."
          ]
        },
        {
          type: 'choice',
          id: 'follow-voices',
          options: [
            {
              label: 'Suivre les voix maintenant',
              description: "Tu repousses la couverture. Le plancher est froid sous tes pieds nus. Tu sais que c'est une mauvaise idée. Tu y vas quand même.",
              goto: 'seq2-artifact'
            },
            {
              label: 'Attendre le matin',
              description: "Tu te tournes vers le mur. Tu fermes les yeux. Tu serres les dents."
            }
          ]
        },
        {
          type: 'narration',
          lines: [
            "Le sommeil ne vient pas. À la place, les images viennent. Tu vois le village d'en haut, comme un oiseau. Les maisons, les rues de terre battue, le puits, la forge. Tout est normal.",
            "Puis une brume monte de la terre, lentement, et les maisons s'effacent une à une. Les gens s'effacent. Tu essaies de crier leurs noms et tu réalises que tu ne t'en souviens plus.",
            "Tu te réveilles en sueur. Il fait encore nuit. L'aimant dans ta poitrine tire plus fort.",
            "Tu y vas."
          ]
        }
      ],
      next: 'seq2-artifact'
    },

    'seq2-artifact': {
      id: 'seq2-artifact',
      blocks: [
        {
          type: 'narration',
          lines: [
            "Tu descends l'escalier. Ta maison est petite : deux pièces, un foyer, une vie simple. Le genre d'endroit dont personne ne se souvient quand tu le décris. \"Un village ? Où ça ?\"\" \"Nulle Part.\"",
            "Sous l'escalier, il y a une trappe. Tu la connais. Elle mène à la cave : trois mètres carrés de terre battue où ta mère stockait des conserves. Tu n'y descends jamais. Il n'y a rien en bas.",
            "Sauf que cette nuit, la trappe est tiède sous tes doigts.",
            "Tu descends."
          ]
        },
        {
          type: 'narration',
          lines: [
            "La cave n'est pas comme dans ton souvenir. Elle est plus grande. Beaucoup plus grande. Le plafond est plus haut, les murs plus éloignés. C'est impossible; ta maison n'est pas si grande. Mais tes pieds touchent le sol et le sol est réel.",
            "Au centre, posé sur la terre nue, quelque chose.",
            "Tu ne saurais pas dire ce que c'est. Pas encore. La forme refuse de se fixer; elle bouge quand tu ne la regardes pas directement. Elle est là et pas là. Comme un mot sur le bout de la langue.",
            "Les voix sont partout maintenant. Elles ne murmurent plus. Elles bourdonnent, comme un essaim, comme mille conversations à peine audibles dont tu ne captes qu'un mot sur cent."
          ]
        },
        {
          type: 'dialogue',
          speaker: null,
          text: "...il manque... il manque..."
        },
        {
          type: 'narration',
          lines: [
            "Tu tends la main. Tes doigts tremblent. L'air autour de l'objet est chaud, puis froid, puis chaud. Comme une respiration."
          ]
        },
        {
          type: 'choice',
          id: 'class-choice',
          prompt: '"Que vois-tu ?"',
          options: [
            { label: 'Une lame brisée, dont les fragments pulsent comme un cœur exposé', setValue: { key: 'classId', value: 'guerrier' } },
            { label: 'Un cristal veiné de lueurs, gravé de runes qui changent quand tu les lis', setValue: { key: 'classId', value: 'mage' } },
            { label: 'Un pendentif sombre qui boit la lumière autour de lui', setValue: { key: 'classId', value: 'voleur' } },
            { label: "Un croc d'os, poli par le temps, encore chaud comme s'il venait d'être arraché", setValue: { key: 'classId', value: 'rodeur' } },
            { label: 'Un fragment de pierre blanche qui émet un son. Une note, pure, continue', setValue: { key: 'classId', value: 'clerc' } }
          ]
        },
        {
          type: 'narration',
          lines: [
            "Tu le touches.",
            "Tout s'arrête. Les voix. L'air. Ton cœur, pendant une seconde qui dure une éternité.",
            "Puis un flash. Pas de lumière. De compréhension. Quelque chose se déverrouille en toi. Quelque chose qui a toujours été là, enfoui sous les années de vie ordinaire, sous les gestes répétés, sous l'habitude de n'être personne."
          ]
        },
        {
          type: 'dialogue',
          speaker: null,
          text: "...%PLAYER_NAME%..."
        },
        {
          type: 'input',
          id: 'player-name',
          prompt: 'Les voix, toutes ensemble, dans un souffle :',
          placeholder: 'Ton nom...',
          saveAs: 'playerName'
        },
        {
          type: 'narration',
          lines: [
            "Le silence tombe. Total. Absolu. Comme si le monde venait de reprendre son souffle après l'avoir retenu très longtemps.",
            "Tu remontes. Tu ne te souviens pas avoir remonté l'escalier. Tu es dans ton lit. L'artefact est dans ta main. Il est tiède. Il est réel.",
            "Dehors, le ciel commence à pâlir.",
            "Tu t'endors sans le vouloir."
          ]
        }
      ],
      next: 'seq3-empty-morning'
    },

    'seq3-empty-morning': {
      id: 'seq3-empty-morning',
      blocks: [
        {
          type: 'narration',
          lines: [
            "La lumière te réveille. Trop de lumière. Les volets sont ouverts. Tu ne les as pas ouverts.",
            "Tu te lèves. L'artefact est encore dans ta main. Tu ne l'as pas lâché de la nuit. Il est froid maintenant. Inerte. On dirait un objet ordinaire. Presque.",
            "Tu sors."
          ]
        },
        {
          type: 'narration',
          lines: [
            "Le village de Nulle Part tient dans un regard. Trente maisons. Une place. Un puits. La forge d'un côté, la chapelle de l'autre, le marché au centre.",
            "Pas un bruit. Pas le silence du matin tôt où le monde dort encore. Le silence de l'absence. Le silence d'un lieu qui contient encore la forme des gens qui l'habitaient mais plus les gens eux-mêmes.",
            "La porte du boulanger est ouverte. Le four est tiède. Il y a de la farine sur le comptoir, un geste interrompu, la trace d'une main dans la poudre blanche. Mais pas de boulanger.",
            "Chez les Aldren, la table est mise. Quatre assiettes. La soupe est encore chaude. Quatre chaises, dont une est renversée. Comme si quelqu'un s'était levé vite. Mais pas assez vite."
          ]
        },
        {
          type: 'choice',
          id: 'morning-reaction',
          options: [
            {
              label: 'Appeler. Crier un nom, n\'importe lequel.',
              description: "Ta voix rebondit sur les murs de pierre. Elle revient déformée. Plus grave. Comme si le village la mâchait avant de te la rendre."
            },
            {
              label: 'Vérifier les maisons une par une.',
              description: "Tu pousses chaque porte. Chaque maison raconte la même histoire. La vie s'est arrêtée au milieu d'un geste. Partout, les mêmes signes : le quotidien figé, l'absence brutale."
            },
            {
              label: 'Rester immobile. Écouter.',
              description: "Tu fermes les yeux. Sous le silence, très loin, tu crois entendre quelque chose. Un bourdonnement. Le même que dans la cave. Mais partout, sous tout le village, comme si la terre elle-même vibrait."
            }
          ]
        },
        {
          type: 'narration',
          lines: [
            "Quelle que soit ta réaction, la réponse est la même : rien.",
            "Tu traverses la place. Tes pas sont trop forts. Tu ne t'étais jamais rendu compte à quel point un village est bruyant jusqu'à ce qu'il ne le soit plus.",
            "Tu remarques les détails. Pas de traces dans la boue du matin. Pas de lutte. Pas de sang. Pas de pas qui partent vers la forêt ou la route.",
            "Les gens ne sont pas partis. Ils n'ont pas été pris. Ils ont simplement cessé d'être là."
          ]
        },
        {
          type: 'choice',
          id: 'artifact-blame',
          options: [
            {
              label: '"C\'est à cause de ça ?"',
              description: "Tu lèves l'artefact devant tes yeux. Il ne brille pas. Il ne fait rien. Mais il est là, et les gens ne le sont plus, et c'est la seule chose qui a changé."
            },
            {
              label: '"C\'est à cause de moi ?"',
              description: "La pensée te frappe comme un coup. Tu étais en bas. Sous la maison. Pendant qu'ils disparaissaient, tu touchais cette chose. Et si c'était le prix ?"
            },
            {
              label: '"..."',
              description: "Tu serres l'artefact dans ta main. Si fort que tes jointures blanchissent. Tu ne sais pas quoi penser. Tu ne sais pas quoi ressentir. Alors tu ne fais rien."
            }
          ]
        },
        {
          type: 'narration',
          lines: [
            "Puis tu le vois.",
            "Le brouillard.",
            "Il n'est pas arrivé. Il est là, comme s'il avait toujours été là et que tu venais seulement de le remarquer. Aux bords du village, entre les dernières maisons et les champs, un mur de gris opaque.",
            "Pas le brouillard du matin qui se lève avec le soleil. Un brouillard immobile. Dense. Qui ne bouge pas avec le vent parce que le vent ne souffle pas dedans.",
            "Il entoure le village entier.",
            "Et dedans, quelque chose bouge.",
            "Des formes. Pas tout à fait des ombres, pas tout à fait des silhouettes. Des corps qui ne sont pas finis. Comme un sculpteur qui aurait abandonné son travail à mi-chemin. Des bras trop longs. Des visages sans traits.",
            "Elles sont lentes. Mais elles avancent.",
            "L'artefact pulse. Fort. Et quelque chose en toi répond : un feu, une tension, un instinct que tu ne connaissais pas. Tes mains savent quoi faire. Ton corps sait où se placer.",
            "Tu n'as jamais appris à te battre.",
            "Mais tu sais."
          ]
        }
      ],
      next: 'seq4-first-combat'
    },

    'seq4-first-combat': {
      id: 'seq4-first-combat',
      blocks: [
        {
          type: 'narration',
          lines: [
            "Trois silhouettes se détachent du brouillard. Elles glissent plus qu'elles ne marchent. Leurs pas ne font aucun bruit dans la boue. Elles ne laissent pas de traces.",
            "L'une d'elles tourne vers toi ce qui pourrait être un visage. Pas d'yeux. Pas de bouche. Juste la forme d'un visage, comme un masque de brume qui se souvient vaguement de ce qu'est un humain.",
            "L'artefact brûle dans ta main.",
            "Tu te mets en garde. Tu ne sais pas d'où te vient ce geste."
          ]
        },
        {
          type: 'combat',
          id: 'tutorial-combat',
          config: {
            gridCols: 5,
            gridRows: 4,
            allies: 'player-only',
            enemies: [{ monsterId: 'silhouette', count: 3 }],
            objective: 'survive',
            terrainTheme: 'ruins'
          }
        },
        {
          type: 'narration',
          lines: [
            "La dernière silhouette s'effiloche. Comme de la fumée aspirée vers le haut. Pas de corps. Pas de sang. Juste l'air qui se referme sur l'espace qu'elle occupait, comme de l'eau sur un trou.",
            "Tu respires. Fort. Tes mains tremblent. Pasde peur, d'autre chose. L'artefact est brûlant. Tes muscles se souviennent de chaque mouvement que tu viens de faire comme s'ils les avaient fait mille fois.",
            "Le brouillard recule de quelques mètres. Pas loin. Comme un animal qui reprend son souffle avant de charger à nouveau.",
            "Puis tu entends quelque chose."
          ]
        },
        {
          type: 'branch',
          key: 'temperament',
          paths: {
            resigne: 'seq5-aldric',
            mefiant: 'seq5-darrick',
            silencieux: 'seq5-seren'
          }
        }
      ]
    },

    'seq5-aldric': {
      id: 'seq5-aldric',
      blocks: [
        {
          type: 'narration',
          lines: [
            "Un son métallique. Régulier. Familier. Quelqu'un frappe sur une enclume.",
            "C'est impossible. Il n'y a plus personne. Mais le son est là, et le brouillard se referme, et c'est la seule direction qu'il te laisse.",
            "Tu cours vers la forge."
          ]
        },
        {
          type: 'narration',
          lines: [
            "La forge de Nulle Part n'a jamais été grande. Quatre murs de pierre noircie, un toit de tôle qui fuit quand il pleut, une enclume qui pèse plus que tout le reste réuni.",
            "Aldric y travaille depuis qu'il a quinze ans. C'est le seul endroit qu'il connaît mieux que sa propre maison.",
            "Il est là. Debout. Le marteau de forge dans une main, un tisonnier dans l'autre. Le feu brûle. Haut, trop haut, il a dû y jeter tout ce qu'il avait. Les flammes éclairent les murs et le brouillard reste dehors, repoussé par la chaleur.",
            "Il te regarde entrer. Ses yeux sont rouges. Pas de larmes. De fumée et de nuits sans sommeil."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Aldric',
          speakerEmoji: '⚔️',
          text: "T'es réel ?"
        },
        {
          type: 'choice',
          id: 'aldric-greeting',
          options: [
            { label: '"Aussi réel que toi."' },
            { label: '"Je crois."' },
            { label: '"..."' }
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Aldric',
          speakerEmoji: '⚔️',
          text: "Ma mère habite trois maisons plus loin. J'ai entendu sa voix cette nuit. Elle m'appelait. Depuis le brouillard."
        },
        {
          type: 'narration',
          lines: [
            "Il regarde le feu."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Aldric',
          speakerEmoji: '⚔️',
          text: "J'ai failli y aller. J'avais la main sur la porte. Mais le feu... je sais pas pourquoi, j'ai mis une bûche de plus au lieu de sortir. Et la voix s'est arrêtée."
        },
        {
          type: 'narration',
          lines: [
            "Le feu crépite. Un morceau de bois éclate. Le brouillard au dehors frémit.",
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Aldric',
          speakerEmoji: '⚔️',
          text: "Tous les autres sont sortis. Pas moi. C'est pas du courage. C'est le feu."
        },
        {
          type: 'narration',
          lines: [
            "Il pose le marteau. Il regarde ses mains. Des mains de forgeron. Larges, brûlées, calleuses. Des mains qui savent tenir quelque chose sans le lâcher.",
            "Le feu faiblit. Les flammes descendent d'un cran. Le brouillard avance d'un pas."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Aldric',
          speakerEmoji: '⚔️',
          text: "...on devrait partir."
        },
        {
          type: 'narration',
          lines: [
            "Il prend le marteau. Pas comme un outil cette fois. Comme une arme."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Aldric',
          speakerEmoji: '⚔️',
          text: "J'espère que t'as un plan. Moi j'en ai pas."
        },
        { type: 'setCompanion', companion: { classId: 'guerrier', name: 'Aldric' } }
      ],
      next: 'seq6-escape'
    },

    'seq5-seren': {
      id: 'seq5-seren',
      blocks: [
        {
          type: 'narration',
          lines: [
            "Une lueur. Faible mais chaude, au milieu de tout ce gris. Elle vient de la chapelle.",
            "Le brouillard entoure le petit bâtiment mais ne le touche pas. Il s'arrête au seuil, comme repoussé par quelque chose d'invisible.",
            "Le brouillard se referme partout ailleurs. Il ne te laisse qu'une direction.",
            "Tu cours vers la lumière."
          ]
        },
        {
          type: 'narration',
          lines: [
            "La chapelle de Nulle Part est la plus petite chose qu'on puisse appeler un lieu de culte. Quatre bancs, un autel de bois, un vitrail qui ne représente rien de précis. Juste de la couleur.",
            "Mais ce matin, le vitrail brille. Pas avec la lumière du soleil. Leciel est gris. Il brille de l'intérieur, d'une lueur qui n'a pas de source.",
            "Sur le seuil, le brouillard s'arrête. Net. Comme un mur invisible.",
            "À l'intérieur, une femme. À genoux devant l'autel. Les mains jointes. Elle ne prie pas; elle écoute.",
            "Une seule bougie est allumée. Elle ne devrait pas éclairer autant.",
            "Elle parle sans se retourner."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Seren',
          speakerEmoji: '✨',
          text: "Je savais que quelqu'un viendrait."
        },
        {
          type: 'choice',
          id: 'seren-greeting',
          options: [
            { label: '"Comment ?"' },
            { label: '"On doit partir."' },
            { label: '"..."' }
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Seren',
          speakerEmoji: '✨',
          text: "Le brouillard est venu cette nuit. Je l'ai senti arriver. Pasentendu, pas vu. Senti. Comme une pression. Comme l'air avant un orage, mais en froid."
        },
        {
          type: 'dialogue',
          speaker: 'Seren',
          speakerEmoji: '✨',
          text: "Il a pris tout le monde. Pas moi."
        },
        {
          type: 'narration',
          lines: [
            "Elle regarde ses mains. Elle ne comprend pas elle-même."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Seren',
          speakerEmoji: '✨',
          text: "Quelque chose m'a protégée. Pas moi. Pas ma foi. Quelque chose dans cet endroit, ou quelque chose en moi que je ne connais pas."
        },
        {
          type: 'narration',
          lines: [
            "Elle te regarde. Ses yeux descendent vers ta main. Vers l'artefact.",
            "Son expression change. Pas de la peur. De la reconnaissance."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Seren',
          speakerEmoji: '✨',
          text: "...alors c'est toi."
        },
        {
          type: 'narration',
          lines: [
            "Elle ne dit pas quoi. Tu ne demandes pas.",
            "La bougie vacille. Pour la première fois, la lumière baisse. Le brouillard au seuil frémit."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Seren',
          speakerEmoji: '✨',
          text: "La bougie ne tiendra plus longtemps. Et quand elle s'éteindra, il n'y aura plus de seuil."
        },
        {
          type: 'narration',
          lines: [
            "Elle ramasse un bâton de marche appuyé contre le mur. Simple. En bois. Mais dans sa main, il a l'air d'autre chose."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Seren',
          speakerEmoji: '✨',
          text: "Allons-y."
        },
        { type: 'setCompanion', companion: { classId: 'clerc', name: 'Seren' } }
      ],
      next: 'seq6-escape'
    },

    'seq5-darrick': {
      id: 'seq5-darrick',
      blocks: [
        {
          type: 'narration',
          lines: [
            "Un sifflement. Bref. Humain. Ça vient d'en haut.",
            "Tu lèves la tête. Sur le toit du marché, une silhouette. Mais pas comme les autres. Celle-ci a un visage. Celle-ci te fait signe.",
            "Le brouillard se referme derrière toi. Il ne te laisse qu'une direction.",
            "Tu grimpes."
          ]
        },
        {
          type: 'narration',
          lines: [
            "Le marché de Nulle Part, c'est huit étals de bois et un auvent qui tient par habitude. Pas le genre d'endroit qu'on escalade.",
            "Mais le type sur le toit a l'air à l'aise, assis au bord, les jambes dans le vide, comme s'il faisait ça tous les jours.",
            "Il mange une pomme. Le brouillard est en dessous, cinq mètres plus bas, comme une mer opaque."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Darrick',
          speakerEmoji: '🗡️',
          text: "Ah. T'es pas une de ces choses."
        },
        {
          type: 'narration',
          lines: [
            "Il croque dans la pomme."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Darrick',
          speakerEmoji: '🗡️',
          text: "Ça fait plaisir. Elles sont pas du genre à faire la conversation."
        },
        {
          type: 'choice',
          id: 'darrick-greeting',
          options: [
            { label: '"T\'as l\'air drôlement calme."' },
            { label: '"Qu\'est-ce que t\'as vu ?"' },
            { label: '"..."' }
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Darrick',
          speakerEmoji: '🗡️',
          text: "Je suis arrivé hier soir. Voyageur. Commerce d'épices, si tu veux tout savoir. J'avais une chambre à l'auberge. Pas cher, pas propre, le charme classique de Nulle Part."
        },
        {
          type: 'narration',
          lines: [
            "Il jette le trognon dans le brouillard. Il tombe sans bruit. Pas de bruit d'impact. Comme s'il n'avait jamais atterri."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Darrick',
          speakerEmoji: '🗡️',
          text: "Vers minuit j'ai entendu les gens sortir. Pas des cris, pas de panique. Des portes qui s'ouvrent. Des pas. Lents. Comme des somnambules."
        },
        {
          type: 'narration',
          lines: [
            "Son visage change. Le sourire tombe pour la première fois."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Darrick',
          speakerEmoji: '🗡️',
          text: "Je me suis mis à la fenêtre. Le brouillard était dans la rue. Épais. Et les gens marchaient dedans. Droit dedans. Comme si quelqu'un les appelait."
        },
        {
          type: 'dialogue',
          speaker: 'Darrick',
          speakerEmoji: '🗡️',
          text: "J'ai vu la boulangère. Le vieux avec la charrette. Une famille entière. Ils marchaient, et le brouillard les prenait, et après il n'y avait plus rien."
        },
        {
          type: 'narration',
          lines: [
            "Il te regarde. Pour la première fois, il a l'air sérieux."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Darrick',
          speakerEmoji: '🗡️',
          text: "T'es le seul que j'ai vu sortir d'une maison ce matin. Le seul."
        },
        {
          type: 'narration',
          lines: [
            "Il se lève. Il époussette son manteau. Un couteau apparaît dans sa main; tu ne l'as pas vu le sortir."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Darrick',
          speakerEmoji: '🗡️',
          text: "Bon. On descend pas par là. Mais on reste pas non plus. T'as un plan ou on marche jusqu'à en avoir un ?"
        },
        { type: 'setCompanion', companion: { classId: 'voleur', name: 'Darrick' } }
      ],
      next: 'seq6-escape'
    },

    'seq6-escape': {
      id: 'seq6-escape',
      blocks: [
        {
          type: 'narration',
          lines: [
            "Le brouillard se resserre. Lentement, mais sûrement. Les rues que tu connaissais rétrécissent. Le gris mange les bords du monde.",
            "Les silhouettes sont de retour. Plus nombreuses. Elles sortent du gris de partout, lentes, déformées. Certaines sont plus grandes que les premières. Certaines ont des bras qui traînent par terre.",
            "L'artefact pulse. Ton compagnon lève son arme."
          ]
        },
        {
          type: 'dialogue',
          speaker: '%COMPANION%',
          text: "La route du sud. Si elle existe encore."
        },
        {
          type: 'dialogue',
          speaker: '%COMPANION%',
          text: "Cours. On se bat en courant."
        },
        {
          type: 'combat',
          id: 'escape-combat',
          config: {
            gridCols: 5,
            gridRows: 4,
            allies: 'player-and-companion',
            enemies: [
              { monsterId: 'silhouette', count: 3, positions: 'front' },
              { monsterId: 'silhouette', count: 2, spawnRound: 2, positions: 'back' }
            ],
            objective: 'escape',
            escapeCol: 4,
            respawnAfter: 3,
            terrainTheme: 'ruins'
          }
        },
        {
          type: 'narration',
          lines: [
            "Le brouillard s'arrête. Net. Comme une ligne tracée dans la terre que personne n'a dessinée.",
            "D'un côté, le gris. De l'autre, le monde. L'herbe. Le ciel. Le vent, surtout. Levent, qui souffle à nouveau, qui bouge, qui vit.",
            "Tu te retournes.",
            "Nulle Part n'est plus là. Pas détruite. Pas en ruines. Juste... absente. Le brouillard occupe l'espace où le village était, dense, opaque, immobile.",
            "Tu es debout sur une route de terre battue qui s'étend dans les deux directions. Des champs vides. Des arbres au loin. Le monde normal, indifférent, qui continue sans savoir ce qui vient de se passer."
          ]
        },
        {
          type: 'branch',
          key: 'temperament',
          paths: {
            resigne: 'seq6-epilogue-aldric',
            mefiant: 'seq6-epilogue-darrick',
            silencieux: 'seq6-epilogue-seren'
          }
        }
      ]
    },

    'seq6-epilogue-aldric': {
      id: 'seq6-epilogue-aldric',
      blocks: [
        {
          type: 'narration',
          lines: [
            "Aldric regarde le brouillard. Longtemps. Le marteau pend au bout de son bras. Il ne dit rien pendant un moment."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Aldric',
          speakerEmoji: '⚔️',
          text: "...j'avais une vie là-dedans."
        },
        {
          type: 'narration',
          lines: [ "Silence." ]
        },
        {
          type: 'dialogue',
          speaker: 'Aldric',
          speakerEmoji: '⚔️',
          text: "C'était pas une grande vie. Mais c'était la mienne."
        },
        {
          type: 'narration',
          lines: [ "Il se tourne vers la route. Il ne regarde plus en arrière." ]
        },
        {
          type: 'dialogue',
          speaker: 'Aldric',
          speakerEmoji: '⚔️',
          text: "On va où ?"
        },
        {
          type: 'narration',
          lines: [
            "Vous avancez sur la route. L'artefact repose dans ta main, tiède, silencieux. Les voix se sont tues.",
            "Pour l'instant.",
            "Derrière vous, le brouillard ne bouge pas. Il attend.",
            "Il a le temps."
          ]
        }
      ],
      next: null
    },

    'seq6-epilogue-seren': {
      id: 'seq6-epilogue-seren',
      blocks: [
        {
          type: 'narration',
          lines: [
            "Seren ferme les yeux. Sa main se pose sur sa poitrine."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Seren',
          speakerEmoji: '✨',
          text: "Ils ne sont pas morts."
        },
        {
          type: 'choice',
          id: 'seren-epilogue',
          options: [
            { label: '"Comment tu le sais ?"' },
            { label: '"..."' }
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Seren',
          speakerEmoji: '✨',
          text: "Je le sens. Comme la bougie dans la chapelle. Quelque chose brûle encore. Quelque part, pas ici, mais quelque part, ils existent encore."
        },
        {
          type: 'narration',
          lines: [ "Elle ouvre les yeux." ]
        },
        {
          type: 'dialogue',
          speaker: 'Seren',
          speakerEmoji: '✨',
          text: "L'objet que tu portes. Il est lié à tout ça. Je ne sais pas comment. Pas encore."
        },
        {
          type: 'narration',
          lines: [ "Elle regarde la route." ]
        },
        {
          type: 'dialogue',
          speaker: 'Seren',
          speakerEmoji: '✨',
          text: "Mais quelqu'un sait."
        },
        {
          type: 'narration',
          lines: [
            "Vous avancez sur la route. L'artefact repose dans ta main, tiède, silencieux. Les voix se sont tues.",
            "Pour l'instant.",
            "Derrière vous, le brouillard ne bouge pas. Il attend.",
            "Il a le temps."
          ]
        }
      ],
      next: null
    },

    'seq6-epilogue-darrick': {
      id: 'seq6-epilogue-darrick',
      blocks: [
        {
          type: 'narration',
          lines: [
            "Darrick regarde le brouillard. Il sort une nouvelle pomme de sa poche (d'où il les tire, c'est un mystère) et la fait tourner entre ses doigts sans la manger."
          ]
        },
        {
          type: 'dialogue',
          speaker: 'Darrick',
          speakerEmoji: '🗡️',
          text: "Bon. Je venais vendre des épices. Safran, cumin, un peu de cannelle. Rien de luxueux. Le genre de truc qu'on met dans une soupe pour oublier que c'est de la soupe."
        },
        {
          type: 'narration',
          lines: [ "Il regarde la pomme." ]
        },
        {
          type: 'dialogue',
          speaker: 'Darrick',
          speakerEmoji: '🗡️',
          text: "Tout est resté là-dedans. Ma charrette. Ma marchandise. Ma chambre pas propre."
        },
        {
          type: 'narration',
          lines: [ "Il croque dans la pomme." ]
        },
        {
          type: 'dialogue',
          speaker: 'Darrick',
          speakerEmoji: '🗡️',
          text: "Bon. Au moins j'ai plus de loyer à payer."
        },
        {
          type: 'narration',
          lines: [ "Il te regarde." ]
        },
        {
          type: 'dialogue',
          speaker: 'Darrick',
          speakerEmoji: '🗡️',
          text: "T'as un plan ou on marche jusqu'à en avoir un ?"
        },
        {
          type: 'narration',
          lines: [
            "Vous avancez sur la route. L'artefact repose dans ta main, tiède, silencieux. Les voix se sont tues.",
            "Pour l'instant.",
            "Derrière vous, le brouillard ne bouge pas. Il attend.",
            "Il a le temps."
          ]
        }
      ],
      next: null
    }
  }
}
