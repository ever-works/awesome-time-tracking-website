import { PricingPlan } from '@/components/pricing/plan-card';
import { Eye, FileText, Globe, Tag, Type } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
interface ProductLink {
    id: string;
    url: string;
    label: string;
    type: "main" | "secondary";
    icon?: string;
  }
  
  interface FormData {
    name: string;
    link: string;
    links: ProductLink[];
    category: string;
    tags: string[];
    description: string;
    introduction: string;
    [key: string]: any;
  }
  
  export interface DetailsFormProps {
    initialData?: Partial<FormData>;
    selectedPlan: PricingPlan | null;
    onSubmit: (data: FormData) => void;
    onBack: () => void;
  }
  
  export const CATEGORIES = [
    "AI Tools",
    "Analytics",
    "API",
    "Automation",
    "Business",
    "Content",
    "Design",
    "Development",
    "E-commerce",
    "Education",
    "Finance",
    "Health",
    "Marketing",
    "Productivity",
    "Security",
    "Social",
    "Other",
  ];
  
  export const TAGS = [
    "Free",
    "Paid",
    "Open Source",
    "SaaS",
    "Mobile",
    "Desktop",
    "Web",
    "API",
    "AI",
    "Machine Learning",
    "Automation",
    "No-Code",
    "Low-Code",
    "Developer Tools",
    "Business Tools",
  ];
  
  export const STEPS = [
    {
      id: 1,
      title: "BASIC_INFO",
      description: "BASIC_INFO_DESC",
      icon: Type,
      fields: ["name", "mainLink"],
      color: "from-blue-500 to-purple-500"
    },
    {
      id: 2,
      title: "CATEGORY_TAGS",
      description: "CATEGORY_TAGS_DESC",
      icon: Tag,
      fields: ["category"],
      color: "from-purple-500 to-pink-500"
    },
    {
      id: 3,
      title: "DESCRIPTION",
      description: "DESCRIPTION_DESC",
      icon: FileText,
      fields: ["description"],
      color: "from-green-500 to-emerald-500"
    },
    {
      id: 4,
      title: "REVIEW",
      description: "REVIEW_DESC",
      icon: Eye,
      fields: [],
      color: "from-orange-500 to-red-500"
    }
  ];
  
export function useDetailForm(initialData: Partial<FormData>, onSubmit: (data: FormData) => void) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>(() => {
      const defaultData = {
        name: "",
        link: "",
        links: [
          {
            id: "main-link",
            url: "",
            label: "Main Website",
            type: "main" as const,
            icon: "Globe",
          },
        ],
        category: "",
        tags: [],
        description: "",
        introduction: "",
      };
  
      // Merge with initialData and sync link field with main link
      const mergedData = { ...defaultData, ...initialData };
  
      // If initialData has a link field, sync it with the main link
      if (initialData.link && mergedData.links[0]) {
        mergedData.links[0].url = initialData.link;
      }
  
      // Ensure link field is synced with main link URL
      const mainLink = mergedData.links.find((l) => l.type === "main");
      mergedData.link = mainLink?.url || "";
  
      return mergedData;
    });
  
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [completedFields, setCompletedFields] = useState<Set<string>>(
      new Set()
    );
    const [animatingLinkId, setAnimatingLinkId] = useState<string | null>(null);
  
    const handleInputChange = useCallback(
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
  
        // Track completed fields with debouncing
        if (value.trim()) {
          setCompletedFields((prev) => new Set([...prev, name]));
        } else {
          setCompletedFields((prev) => {
            const newSet = new Set([...prev]);
            newSet.delete(name);
            return newSet;
          });
        }
      },
      []
    );
  
    const handleLinkChange = useCallback(
      (id: string, field: "url" | "label", value: string) => {
        setFormData((prev) => {
          const updatedLinks = prev.links.map((link) =>
            link.id === id ? { ...link, [field]: value } : link
          );
  
          // Sync main link URL with backward compatibility field
          const mainLink = updatedLinks.find((l) => l.type === "main");
  
          return {
            ...prev,
            links: updatedLinks,
            link: mainLink?.url || "", // Always sync with main link URL
          };
        });
  
        // Track main link completion
        const mainLink = formData.links.find((l) => l.type === "main");
        if (mainLink?.id === id && field === "url") {
          if (value.trim()) {
            setCompletedFields((prev) => new Set([...prev, "mainLink"]));
          } else {
            setCompletedFields((prev) => {
              const newSet = new Set([...prev]);
              newSet.delete("mainLink");
              return newSet;
            });
          }
        }
      },
      [formData.links]
    );
  
    const addLink = useCallback(() => {
      const newId = `link-${Date.now()}`;
      setAnimatingLinkId(newId);
  
      setFormData((prev) => ({
        ...prev,
        links: [
          ...prev.links,
          {
            id: newId,
            url: "",
            label: "Additional Link",
            type: "secondary" as const,
            icon: "Globe",
          },
        ],
      }));
      setTimeout(() => setAnimatingLinkId(null), 500);
    }, []);
  
    const removeLink = useCallback(
      (id: string) => {
        const linkToRemove = formData.links.find((l) => l.id === id);
        if (linkToRemove?.type === "main") return; // Don't remove main link
  
        setAnimatingLinkId(id);
  
        // Delay removal for exit animation
        setTimeout(() => {
          setFormData((prev) => ({
            ...prev,
            links: prev.links.filter((link) => link.id !== id),
          }));
          setAnimatingLinkId(null);
        }, 300);
      },
      [formData.links]
    );
  
    const handleTagToggle = useCallback((tag: string) => {
      setFormData((prev) => {
        const currentTags = [...prev.tags];
        if (currentTags.includes(tag)) {
          return { ...prev, tags: currentTags.filter((t) => t !== tag) };
        } else {
          return { ...prev, tags: [...currentTags, tag] };
        }
      });
    }, []);
  
    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
  
        const mainLink = formData.links.find((l) => l.type === "main");
        const transformedData = {
          ...formData,
          link: mainLink?.url || "",
          links: formData.links,
        };
  
        onSubmit?.(transformedData);
      },
      [formData, onSubmit]
    );
  
    const validateStep = useCallback((step: number) => {
      const stepConfig = STEPS.find(s => s.id === step);
      if (!stepConfig) return false;
  
      return stepConfig.fields.every(field => {
        if (field === "mainLink") {
          return formData.links.find((l) => l.type === "main")?.url?.trim();
        }
        return formData[field] && formData[field].toString().trim();
      });
    }, [formData]);
  
    const nextStep = useCallback(() => {
      if (currentStep < STEPS.length && validateStep(currentStep)) {
        setCurrentStep(prev => prev + 1);
      }
    }, [currentStep, validateStep]);
  
    const prevStep = useCallback(() => {
      if (currentStep > 1) {
        setCurrentStep(prev => prev - 1);
      }
    }, [currentStep]);
  
    // Calcul du progrès global
    const { progressPercentage, completedRequiredFields, requiredFieldsCount } =
      useMemo(() => {
        const required = 4; // name, mainLink, category, description
        const completed = ["name", "mainLink", "category", "description"].filter(
          (field) => {
            if (field === "mainLink") {
              return formData.links.find((l) => l.type === "main")?.url?.trim();
            }
            return formData[field] && formData[field].toString().trim();
          }
        ).length;
  
        return {
          requiredFieldsCount: required,
          completedRequiredFields: completed,
          progressPercentage: (completed / required) * 100,
        };
      }, [formData]);
  
    const getIconComponent = () => {
      return Globe;
    };

    return {
        currentStep,
        formData,
        focusedField,
        completedFields,
        animatingLinkId,
        handleInputChange,
        handleLinkChange,
        addLink,
        removeLink,
        handleTagToggle,
        handleSubmit,
        nextStep,
        prevStep,
        progressPercentage, 
        completedRequiredFields,
        requiredFieldsCount,
        getIconComponent,
        validateStep,
       setCurrentStep,
        setFormData,
        setAnimatingLinkId,
        setFocusedField
    
    }
}

