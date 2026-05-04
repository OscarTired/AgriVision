"use client";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { UploadCloud, X, Camera, Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { DiagnosisFormValues } from "@/hooks/use-diagnosis";

interface DiagnosisFormProps {
  form: UseFormReturn<DiagnosisFormValues>;
  onSubmit: (data: DiagnosisFormValues) => void;
  isLoading: boolean;
  imagePreview: string | null;
  handleImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: () => void;
  gettingLocation: boolean;
  handleGetLocation: () => void;
  hasLocation: boolean;
}

export function DiagnosisForm({
  form,
  onSubmit,
  isLoading,
  imagePreview,
  handleImageChange,
  handleRemoveImage,
  gettingLocation,
  handleGetLocation,
  hasLocation,
}: DiagnosisFormProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 min-w-0 w-full">
        {/* Cultivo fijo: Frambuesa Heritage */}
        <div className="rounded-lg border bg-card p-4 stagger-item transition-all duration-normal hover:border-primary/30 hover:shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1 font-body">Cultivo Especializado</p>
          <p className="text-lg font-semibold text-primary font-display">Frambuesa Heritage</p>
          <p className="text-xs text-muted-foreground mt-1 font-body">
            Esta aplicación está especializada en el diagnóstico de Frambuesa Heritage (Rubus idaeus var. Heritage).
          </p>
        </div>

        <FormField
          control={form.control}
          name="cropImage"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Imagen del Cultivo</FormLabel>
              <FormControl>
                <div className="w-full min-w-0">
                  {!imagePreview ? (
                    <label
                      htmlFor="dropzone-file"
                      className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer group overflow-hidden transition-all duration-300 ${
                        isDragging 
                          ? 'border-primary bg-primary/5 scale-[1.02]' 
                          : 'border-border bg-card hover:bg-muted/30'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const fileList = e.dataTransfer.files;
                          
                          // Validar que sea imagen
                          if (!fileList[0].type.startsWith('image/')) return;
                          
                          // Update form hook
                          onChange(fileList);
                          
                          // Trigger original image handler with mock event
                          const mockEvent = {
                            target: { files: fileList }
                          } as React.ChangeEvent<HTMLInputElement>;
                          handleImageChange(mockEvent);
                        }
                      }}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                        <UploadCloud className={`w-10 h-10 mb-3 transition-all duration-300 ${isDragging ? 'text-primary scale-125' : 'text-muted-foreground group-hover:scale-110 group-hover:text-primary'} animate-float`} style={{ animationDuration: '3s' }} />
                        <p className="mb-2 text-sm text-muted-foreground text-center font-body">
                          <span className="font-semibold">Haga clic para subir</span> o arrastre y suelte
                        </p>
                        <p className="text-xs text-muted-foreground text-center px-2 font-body">Formatos aceptados: JPG, PNG, WEBP (Máx. 5MB)</p>
                        <p className="text-xs text-muted-foreground mt-1 text-center px-2 font-body">
                          Asegúrese de que la imagen sea clara y del área afectada.
                        </p>
                      </div>
                      <Input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => {
                          onChange(e.target.files);
                          handleImageChange(e);
                        }}
                        {...rest}
                      />
                    </label>
                  ) : (
                    <div className="relative w-full h-64 border-2 border-solid border-primary/20 rounded-lg overflow-hidden bg-card animate-scale-in">
                      <Image
                        src={imagePreview}
                        alt="Imagen del cultivo seleccionada"
                        fill
                        className="object-cover transition-transform duration-slow hover:scale-[1.02]"
                        data-ai-hint="crop plant"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-all duration-normal backdrop-blur-[1px] flex items-center justify-center gap-2 px-4">
                        <label
                          htmlFor="dropzone-file-change"
                          className="bg-primary text-primary-foreground px-3 py-2 rounded-md cursor-pointer hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium flex-shrink-0"
                        >
                          <Camera className="w-4 h-4" />
                          <span className="hidden sm:inline">Cambiar</span>
                        </label>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="flex items-center gap-2 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                          <span className="hidden sm:inline">Quitar</span>
                        </Button>
                      </div>
                      <Input
                        id="dropzone-file-change"
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => {
                          onChange(e.target.files);
                          handleImageChange(e);
                        }}
                        {...rest}
                      />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>Suba una imagen clara del cultivo afectado para un mejor diagnóstico.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="button" onClick={handleGetLocation} className="w-full btn-press">
          {gettingLocation ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Obteniendo ubicación...
            </>
          ) : (
            'Obtener Ubicación'
          )}
        </Button>

        <Button type="submit" disabled={isLoading || !hasLocation || !imagePreview} className="w-full btn-press">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Diagnosticando...
            </>
          ) : (
            "Diagnosticar Cultivo"
          )}
        </Button>
      </form>
    </Form>
  );
}
