import { BaseGenerator } from './base-generator'
import { ExportOptions, ExportResult } from '../export-service'

export class AnalysisJSONGenerator extends BaseGenerator {
  async generate(data: any, scriptId: string, options: ExportOptions): Promise<ExportResult> {
    const exportData = this.formatAnalysisData(data, options)

    const jsonContent = options.includeMetadata
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData.analysis, null, 2)

    const filename = `analysis-${scriptId}.json`
    return this.saveFile(jsonContent, filename, 'application/json')
  }

  private formatAnalysisData(data: any, options: ExportOptions) {
    const analysis = {
      script: {
        id: data.script?.id,
        title: data.script?.title,
        author: data.script?.author,
        pageCount: data.script?.pageCount,
        genre: data.script?.genreOverride,
        logline: data.script?.logline,
        synopsis: data.script?.synopsisShort,
        processedAt: data.script?.processedAt,
        status: data.script?.status
      },
      scores: data.scores?.map((score: any) => ({
        category: score.category,
        value: score.value,
        reasoning: score.reasoning,
        confidence: score.confidence
      })) || [],
      beats: data.beats?.map((beat: any) => ({
        kind: beat.kind,
        page: beat.page,
        content: beat.content,
        timingFlag: beat.timingFlag,
        confidence: beat.confidence
      })) || [],
      notes: data.notes?.map((note: any) => ({
        area: note.area,
        severity: note.severity,
        page: note.page,
        lineRef: note.lineRef,
        excerpt: note.excerpt,
        suggestion: note.suggestion,
        ruleCode: note.ruleCode
      })) || [],
      pageMetrics: data.pageMetrics?.map((metric: any) => ({
        page: metric.page,
        tensionScore: metric.tensionScore,
        complexityScore: metric.complexityScore,
        dialogueLines: metric.dialogueLines,
        actionLines: metric.actionLines,
        sceneLengthLines: metric.sceneLengthLines
      })) || [],
      characterAnalysis: {
        scenes: data.characterScenes?.map((cs: any) => ({
          characterId: cs.characterId,
          sceneId: cs.sceneId,
          lines: cs.lines,
          words: cs.words,
          presenceType: cs.presenceType
        })) || [],
        summary: this.generateCharacterSummary(data.characterScenes)
      },
      feasibility: data.feasibility?.map((metric: any) => ({
        category: metric.category,
        value: metric.value,
        reasoning: metric.reasoning,
        budgetImpact: metric.budgetImpact,
        complexity: metric.complexity
      })) || [],
      riskAssessment: data.riskFlags?.map((risk: any) => ({
        category: risk.category,
        severity: risk.severity,
        description: risk.description,
        mitigation: risk.mitigation,
        confidence: risk.confidence
      })) || [],
      analytics: {
        overallScore: this.calculateOverallScore(data.scores),
        riskProfile: this.calculateRiskProfile(data.riskFlags),
        characterDistribution: this.analyzeCharacterDistribution(data.characterScenes),
        pacingAnalysis: this.analyzePacing(data.pageMetrics, data.beats),
        genreCompliance: this.analyzeGenreCompliance(data.script, data.scores)
      }
    }

    if (options.includeMetadata) {
      return {
        metadata: {
          exportedAt: new Date().toISOString(),
          exportVersion: '1.0',
          platform: 'ScriptyBoy',
          dataStructure: 'complete-analysis',
          totalDataPoints: this.countDataPoints(analysis)
        },
        analysis
      }
    }

    return analysis
  }

  private generateCharacterSummary(characterScenes: any[]) {
    if (!characterScenes?.length) return null

    const characterStats = new Map()

    characterScenes.forEach((cs: any) => {
      const charId = cs.characterId
      if (!characterStats.has(charId)) {
        characterStats.set(charId, {
          id: charId,
          totalLines: 0,
          totalWords: 0,
          scenesAppeared: 0
        })
      }

      const char = characterStats.get(charId)
      char.totalLines += cs.lines || 0
      char.totalWords += cs.words || 0
      char.scenesAppeared += 1
    })

    return Array.from(characterStats.values()).sort((a, b) => b.totalLines - a.totalLines)
  }

  private calculateOverallScore(scores: any[]) {
    if (!scores?.length) return null

    const avgScore = scores.reduce((sum, score) => sum + score.value, 0) / scores.length
    const distribution = {
      high: scores.filter(s => s.value >= 8).length,
      medium: scores.filter(s => s.value >= 6 && s.value < 8).length,
      low: scores.filter(s => s.value < 6).length
    }

    return {
      average: Number(avgScore.toFixed(2)),
      distribution,
      recommendation: avgScore >= 8 ? 'RECOMMEND' : avgScore >= 6 ? 'CONSIDER' : 'PASS'
    }
  }

  private calculateRiskProfile(riskFlags: any[]) {
    if (!riskFlags?.length) return { total: 0, profile: 'LOW_RISK' }

    const riskCounts = {
      HIGH: riskFlags.filter(r => r.severity === 'HIGH').length,
      MEDIUM: riskFlags.filter(r => r.severity === 'MEDIUM').length,
      LOW: riskFlags.filter(r => r.severity === 'LOW').length
    }

    let profile = 'LOW_RISK'
    if (riskCounts.HIGH > 0) profile = 'HIGH_RISK'
    else if (riskCounts.MEDIUM > 2) profile = 'MEDIUM_RISK'

    return {
      total: riskFlags.length,
      distribution: riskCounts,
      profile
    }
  }

  private analyzeCharacterDistribution(characterScenes: any[]) {
    if (!characterScenes?.length) return null

    const characterStats = this.generateCharacterSummary(characterScenes)
    const totalLines = characterStats?.reduce((sum, char) => sum + char.totalLines, 0) || 0

    return {
      totalCharacters: characterStats?.length || 0,
      mainCharacters: characterStats?.filter(c => c.totalLines > 20).length || 0,
      dialogueDistribution: characterStats?.slice(0, 5).map(char => ({
        characterId: char.id,
        percentage: totalLines > 0 ? Number(((char.totalLines / totalLines) * 100).toFixed(1)) : 0
      })) || []
    }
  }

  private analyzePacing(pageMetrics: any[], beats: any[]) {
    if (!pageMetrics?.length) return null

    const avgTension = pageMetrics.reduce((sum, pm) => sum + (pm.tensionScore || 0), 0) / pageMetrics.length
    const avgComplexity = pageMetrics.reduce((sum, pm) => sum + (pm.complexityScore || 0), 0) / pageMetrics.length

    return {
      averageTension: Number(avgTension.toFixed(2)),
      averageComplexity: Number(avgComplexity.toFixed(2)),
      beatsIdentified: beats?.length || 0,
      paceVariation: this.calculatePaceVariation(pageMetrics)
    }
  }

  private calculatePaceVariation(pageMetrics: any[]) {
    if (!pageMetrics?.length) return 'UNKNOWN'

    const tensions = pageMetrics.map(pm => pm.tensionScore || 0)
    const max = Math.max(...tensions)
    const min = Math.min(...tensions)
    const variation = max - min

    if (variation > 6) return 'HIGH'
    if (variation > 3) return 'MEDIUM'
    return 'LOW'
  }

  private analyzeGenreCompliance(script: any, scores: any[]) {
    if (!script?.genreOverride || !scores?.length) return null

    const structureScore = scores.find(s => s.category === 'STRUCTURE')?.value || 0
    const genreScore = scores.find(s => s.category === 'GENRE')?.value || 0

    return {
      genre: script.genreOverride,
      structureScore,
      genreScore,
      compliance: (structureScore + genreScore) / 2 >= 7 ? 'HIGH' : 'MEDIUM'
    }
  }

  private countDataPoints(analysis: any): number {
    return (analysis.scores?.length || 0) +
           (analysis.beats?.length || 0) +
           (analysis.notes?.length || 0) +
           (analysis.pageMetrics?.length || 0) +
           (analysis.characterAnalysis?.scenes?.length || 0) +
           (analysis.feasibility?.length || 0) +
           (analysis.riskAssessment?.length || 0)
  }
}