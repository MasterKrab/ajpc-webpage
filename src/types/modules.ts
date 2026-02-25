export type MaterialType = 'link' | 'document'

export interface Material {
  id: string
  title: string
  url: string
  type: MaterialType
  moduleId: string
  createdAt: Date | null
}

export interface Module {
  id: string
  courseId: string
  title: string
  description: string | null
  materials: Material[]
  createdAt: Date | null
  updatedAt: Date | null
}
