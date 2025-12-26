"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface PetItem {
  name: string;
  role: string;
  avatar: string;
  description: string;
}

interface PetsFormProps {
  value: string;
  onChange: (json: string) => void;
}

const DEFAULT_PET: PetItem = { name: "", role: "", avatar: "", description: "" };

export default function PetsForm({ value, onChange }: PetsFormProps) {
  let pets: PetItem[] = [];
  try {
    if (value) pets = JSON.parse(value);
  } catch { /* 使用空数组 */ }

  const updatePets = (newPets: PetItem[]) => {
    onChange(JSON.stringify(newPets, null, 2));
  };

  const addPet = () => {
    updatePets([...pets, { ...DEFAULT_PET }]);
  };

  const removePet = (index: number) => {
    updatePets(pets.filter((_, i) => i !== index));
  };

  const updatePet = (index: number, field: keyof PetItem, val: string) => {
    const newPets = [...pets];
    newPets[index] = { ...newPets[index], [field]: val };
    updatePets(newPets);
  };

  return (
    <div className="space-y-4">
      {pets.map((pet, index) => (
        <div key={index} className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg space-y-2 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => removePet(index)}
          >
            <X className="w-3 h-3 text-gray-400" />
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-gray-500">名字</Label>
              <Input
                value={pet.name}
                onChange={(e) => updatePet(index, "name", e.target.value)}
                placeholder="球球"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">角色</Label>
              <Input
                value={pet.role}
                onChange={(e) => updatePet(index, "role", e.target.value)}
                placeholder="CTO / 首席监工"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] text-gray-500">头像 URL</Label>
            <Input
              value={pet.avatar}
              onChange={(e) => updatePet(index, "avatar", e.target.value)}
              placeholder="https://..."
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-[10px] text-gray-500">描述</Label>
            <Input
              value={pet.description}
              onChange={(e) => updatePet(index, "description", e.target.value)}
              placeholder="高冷狸花猫..."
              className="h-8 text-sm"
            />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addPet}>
        <Plus className="w-3 h-3 mr-1" /> 添加宠物
      </Button>
    </div>
  );
}
