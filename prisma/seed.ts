import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default roles
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Standard user with basic access',
      permissions: [
        'scripts:upload',
        'scripts:read',
        'scripts:delete',
        'analysis:read',
        'profile:read',
        'profile:update',
      ],
      isDefault: true,
    },
  })

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full system access',
      permissions: [
        'scripts:upload',
        'scripts:read',
        'scripts:delete',
        'scripts:manage_all',
        'analysis:read',
        'analysis:manage_all',
        'users:read',
        'users:manage',
        'roles:read',
        'roles:manage',
        'organizations:read',
        'organizations:manage',
        'billing:read',
        'billing:manage',
        'analytics:read',
        'system:admin',
      ],
      isDefault: false,
    },
  })

  console.log('✅ Default roles created:', {
    user: userRole.id,
    admin: adminRole.id,
  })

  // MVP Analysis Seed Data
  console.log('🎬 Seeding MVP analysis demo data...')

  // 1) Ensure we have a user to attach to (create or use existing)
  let user = await prisma.user.findFirst({
    where: { email: "seed@scriptyboy.local" }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "seed@scriptyboy.local",
        name: "Seed User",
        firstName: "Seed",
        lastName: "User",
        plan: "PRO",
        analysesLimit: 100,
        roleId: userRole.id
      }
    });
  }

  // 2) Create a project
  const project = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      userId: user.id,
      name: "Sample Feature — Project Alpha",
      description: "Seed project for dashboard demo",
      type: "FEATURE_INDEPENDENT",
      genre: "Thriller",
      targetBudget: "MEDIUM",
      developmentStage: "REVISION"
    }
  });

  // 3) Create the script with MVP analysis fields
  const script = await prisma.script.upsert({
    where: { id: "seed-script-1" },
    update: {},
    create: {
      id: "seed-script-1",
      userId: user.id,
      projectId: project.id,
      originalFilename: "the-clockmaker.fdx",
      title: "The Clockmaker",
      author: "Seed Author",
      format: "FDX",
      fileSize: 2048000,
      pageCount: 110,
      totalScenes: 3,
      totalCharacters: 2,
      status: "COMPLETED",
      logline: "A meticulous clockmaker must pull one last heist to stop time running out on his daughter's life.",
      synopsisShort: "When a reclusive artisan is coerced into a museum heist, he must outwit both his partners and an old nemesis to save his daughter's life.",
      synopsisLong: "Act I: Olin, a master clockmaker, discovers his daughter Maya needs life-saving surgery. Act II: Blackmailed into a museum heist, he must navigate treacherous partners and security systems. Act III: In a final confrontation, Olin uses his clockmaking precision to escape and reconcile with Maya.",
      genreOverride: "Thriller",
      comps: {
        titles: ["Sicario", "Heat (tone)"],
        note: "Non-copyright comps for demo purposes"
      }
    }
  });

  // 4) Create scenes with MVP analysis fields
  const scene1 = await prisma.scene.upsert({
    where: { id: "seed-scene-1" },
    update: {},
    create: {
      id: "seed-scene-1",
      scriptId: script.id,
      sceneNumber: "1",
      type: "SCENE_HEADING",
      content: "INT. WORKSHOP - NIGHT\\n\\nGears whir. OLIN (60s) files a tiny cog with surgical precision...",
      pageNumber: 1,
      lineNumber: 1,
      orderIndex: 1,
      wordCount: 65,
      intExt: "INT",
      location: "WORKSHOP",
      tod: "NIGHT",
      pageStart: 1,
      pageEnd: 4
    }
  });

  const scene2 = await prisma.scene.upsert({
    where: { id: "seed-scene-2" },
    update: {},
    create: {
      id: "seed-scene-2",
      scriptId: script.id,
      sceneNumber: "25",
      type: "SCENE_HEADING",
      content: "EXT. MUSEUM ROOF - NIGHT\\n\\nMAYA and team prepare for entry...",
      pageNumber: 25,
      lineNumber: 450,
      orderIndex: 2,
      wordCount: 142,
      intExt: "EXT",
      location: "MUSEUM ROOF",
      tod: "NIGHT",
      pageStart: 25,
      pageEnd: 27
    }
  });

  const scene3 = await prisma.scene.upsert({
    where: { id: "seed-scene-3" },
    update: {},
    create: {
      id: "seed-scene-3",
      scriptId: script.id,
      sceneNumber: "104",
      type: "SCENE_HEADING",
      content: "INT. MUSEUM VAULT - NIGHT\\n\\nThe final confrontation unfolds...",
      pageNumber: 104,
      lineNumber: 2800,
      orderIndex: 3,
      wordCount: 180,
      intExt: "INT",
      location: "MUSEUM VAULT",
      tod: "NIGHT",
      pageStart: 104,
      pageEnd: 110
    }
  });

  // 5) Create characters with aliases
  const maya = await prisma.character.upsert({
    where: { id: "seed-char-maya" },
    update: {},
    create: {
      id: "seed-char-maya",
      scriptId: script.id,
      name: "MAYA",
      dialogueCount: 42,
      firstAppearance: 25,
      aliases: ["MAY", "M"]
    }
  });

  const olin = await prisma.character.upsert({
    where: { id: "seed-char-olin" },
    update: {},
    create: {
      id: "seed-char-olin",
      scriptId: script.id,
      name: "OLIN",
      dialogueCount: 31,
      firstAppearance: 1,
      aliases: []
    }
  });

  // 6) Create elements
  await prisma.element.createMany({
    data: [
      {
        sceneId: scene1.id,
        type: "SCENE_HEADING",
        text: "INT. WORKSHOP - NIGHT",
        orderIndex: 0
      },
      {
        sceneId: scene1.id,
        type: "ACTION",
        text: "Gears whir. OLIN files a tiny cog.",
        orderIndex: 1
      },
      {
        sceneId: scene1.id,
        type: "DIALOGUE",
        charName: "OLIN",
        text: "Time is a liar.",
        orderIndex: 2
      },
      {
        sceneId: scene2.id,
        type: "SCENE_HEADING",
        text: "EXT. MUSEUM ROOF - NIGHT",
        orderIndex: 0
      },
      {
        sceneId: scene3.id,
        type: "SCENE_HEADING",
        text: "INT. MUSEUM VAULT - NIGHT",
        orderIndex: 0
      }
    ],
    skipDuplicates: true
  });

  // 7) Character presence data
  await prisma.characterScene.createMany({
    data: [
      { characterId: maya.id, sceneId: scene1.id, lines: 5, words: 60 },
      { characterId: olin.id, sceneId: scene1.id, lines: 7, words: 80 },
      { characterId: maya.id, sceneId: scene2.id, lines: 12, words: 140 },
      { characterId: olin.id, sceneId: scene3.id, lines: 10, words: 120 }
    ],
    skipDuplicates: true
  });

  // 8) Feasibility metrics per scene
  await prisma.feasibilityMetric.createMany({
    data: [
      {
        sceneId: scene1.id,
        intExt: "INT",
        location: "WORKSHOP",
        tod: "NIGHT",
        hasSpecialProps: true,
        complexityScore: 2
      },
      {
        sceneId: scene2.id,
        intExt: "EXT",
        location: "MUSEUM ROOF",
        tod: "NIGHT",
        hasStunts: true,
        hasVehicles: true,
        complexityScore: 6
      },
      {
        sceneId: scene3.id,
        intExt: "INT",
        location: "MUSEUM VAULT",
        tod: "NIGHT",
        hasVfx: true,
        hasSfx: true,
        complexityScore: 8
      }
    ],
    skipDuplicates: true
  });

  // 9) Story beats
  await prisma.beat.createMany({
    data: [
      {
        scriptId: script.id,
        kind: "INCITING",
        page: 12,
        confidence: 0.82,
        timingFlag: "ON_TIME",
        rationale: "Catalyst: museum blackmail call."
      },
      {
        scriptId: script.id,
        kind: "ACT1_BREAK",
        page: 25,
        confidence: 0.78,
        timingFlag: "ON_TIME",
        rationale: "Commitment: team forms."
      },
      {
        scriptId: script.id,
        kind: "MIDPOINT",
        page: 55,
        confidence: 0.74,
        timingFlag: "ON_TIME",
        rationale: "Vault layout revelation."
      },
      {
        scriptId: script.id,
        kind: "LOW_POINT",
        page: 75,
        confidence: 0.69,
        timingFlag: "ON_TIME",
        rationale: "Daughter endangered."
      },
      {
        scriptId: script.id,
        kind: "ACT2_BREAK",
        page: 90,
        confidence: 0.71,
        timingFlag: "ON_TIME",
        rationale: "New plan with higher risk."
      },
      {
        scriptId: script.id,
        kind: "CLIMAX",
        page: 104,
        confidence: 0.77,
        timingFlag: "ON_TIME",
        rationale: "Vault confrontation."
      },
      {
        scriptId: script.id,
        kind: "RESOLUTION",
        page: 110,
        confidence: 0.76,
        timingFlag: "ON_TIME",
        rationale: "Reconciliation."
      }
    ],
    skipDuplicates: true
  });

  // 10) Analysis notes
  await prisma.note.createMany({
    data: [
      {
        scriptId: script.id,
        severity: "HIGH",
        area: "STRUCTURE",
        sceneId: scene2.id,
        page: 25,
        lineRef: 4,
        excerpt: "Team accepts the heist too quickly.",
        suggestion: "Add a refusal beat and consequence to raise stakes.",
        applyHook: {
          op: "insert",
          range: { sceneId: scene2.id, from: 3, to: 4 }
        },
        ruleCode: "STRUCT_BEAT_EARLY"
      },
      {
        scriptId: script.id,
        severity: "MEDIUM",
        area: "DIALOGUE",
        sceneId: scene1.id,
        page: 2,
        lineRef: 12,
        excerpt: "On-the-nose line about 'time'.",
        suggestion: "Replace with a visual action that implies urgency.",
        applyHook: {
          op: "replace",
          range: { sceneId: scene1.id, from: 12, to: 12 }
        },
        ruleCode: "DIALOGUE_ON_NOSE"
      }
    ],
    skipDuplicates: true
  });

  // 11) Rubric scores
  await prisma.score.createMany({
    data: [
      {
        scriptId: script.id,
        category: "STRUCTURE",
        value: 7.5,
        rationale: "Beats land on-time."
      },
      {
        scriptId: script.id,
        category: "CHARACTER",
        value: 7.0,
        rationale: "Clear goals; antagonist pressure ok."
      },
      {
        scriptId: script.id,
        category: "DIALOGUE",
        value: 6.5,
        rationale: "Some on-the-nose lines."
      },
      {
        scriptId: script.id,
        category: "PACING",
        value: 7.2,
        rationale: "Minor flat spots in Act II."
      },
      {
        scriptId: script.id,
        category: "THEME",
        value: 7.0,
        rationale: "Consistent 'time/value' motif."
      },
      {
        scriptId: script.id,
        category: "GENRE_FIT",
        value: 7.8,
        rationale: "Tonal alignment with heist thrillers."
      },
      {
        scriptId: script.id,
        category: "ORIGINALITY",
        value: 6.8,
        rationale: "Fresh prop mechanics."
      },
      {
        scriptId: script.id,
        category: "FEASIBILITY",
        value: 6.9,
        rationale: "Vault/VFX increases costs."
      }
    ],
    skipDuplicates: true
  });

  // 12) Page metrics (sample pages)
  await prisma.pageMetric.createMany({
    data: [
      {
        scriptId: script.id,
        page: 1,
        sceneLengthLines: 48,
        dialogueLines: 10,
        actionLines: 38,
        tensionScore: 2,
        complexityScore: 3
      },
      {
        scriptId: script.id,
        page: 25,
        sceneLengthLines: 55,
        dialogueLines: 28,
        actionLines: 27,
        tensionScore: 5,
        complexityScore: 6
      },
      {
        scriptId: script.id,
        page: 55,
        sceneLengthLines: 50,
        dialogueLines: 18,
        actionLines: 32,
        tensionScore: 6,
        complexityScore: 5
      },
      {
        scriptId: script.id,
        page: 104,
        sceneLengthLines: 60,
        dialogueLines: 12,
        actionLines: 48,
        tensionScore: 9,
        complexityScore: 8
      }
    ],
    skipDuplicates: true
  });

  // 13) Subplot data
  const subplot = await prisma.subplot.upsert({
    where: { id: "seed-subplot-1" },
    update: {},
    create: {
      id: "seed-subplot-1",
      scriptId: script.id,
      label: "Father–Daughter Trust",
      description: "Olin hides diagnosis; Maya seeks agency."
    }
  });

  await prisma.subplotSpan.createMany({
    data: [
      { subplotId: subplot.id, sceneId: scene1.id, role: "INTRO" },
      { subplotId: subplot.id, sceneId: scene2.id, role: "DEVELOP" },
      { subplotId: subplot.id, sceneId: scene3.id, role: "RESOLVE" }
    ],
    skipDuplicates: true
  });

  // 14) Theme statements & alignment
  const themeStatement = await prisma.themeStatement.upsert({
    where: { id: "seed-theme-1" },
    update: {},
    create: {
      id: "seed-theme-1",
      scriptId: script.id,
      statement: "Time is only valuable when it's shared.",
      confidence: 0.79
    }
  });

  await prisma.sceneThemeAlignment.upsert({
    where: { sceneId: scene1.id },
    update: {},
    create: {
      sceneId: scene1.id,
      onTheme: true,
      rationale: "Workshop intro juxtaposes craft vs. life."
    }
  });

  // 15) Risk flags
  await prisma.riskFlag.createMany({
    data: [
      {
        scriptId: script.id,
        sceneId: scene3.id,
        kind: "TRADEMARK",
        page: 104,
        startLine: 6,
        endLine: 8,
        snippet: "Brand-name security system referenced.",
        confidence: 0.61
      }
    ],
    skipDuplicates: true
  });

  console.log('✅ MVP analysis seed complete!')
  console.log(`   📄 Script: ${script.title} (${script.id})`)
  console.log(`   🏗️  Project: ${project.name} (${project.id})`)
  console.log(`   👤 User: ${user.email} (${user.id})`)
  console.log(`   🎬 Scenes: 3 scenes created`)
  console.log(`   👥 Characters: 2 characters created`)
  console.log(`   📊 Analysis: beats, notes, scores, metrics populated`)

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })