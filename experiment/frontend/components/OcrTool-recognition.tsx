"use client";

import React from "react";
import { useOcrStore } from "@/store/ocrStore-recognition";
import { UploadTab } from "./UploadTab-recognition";
import { ExtractTab } from "./ExtractTab-recognition";
import { ResultsTab } from "./ResultsTab-recognition";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Recognition/tabs";

export function OcrTool() {
  const { currentTab, setCurrentTab } = useOcrStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-500 to-purple-600 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Khmer Text Annotation Tool
          </h1>
          <p className="text-purple-100">
            Upload images and extract the Khmer text with OCR
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Tabs Navigation */}
          <Tabs
            value={currentTab}
            onValueChange={(tab: any) => setCurrentTab(tab)}
            className="w-full"
          >
            <TabsList className="w-full border-b bg-transparent rounded-none">
              <div className="flex w-full">
                <TabsTrigger
                  value="upload"
                  className="flex-1 py-4 px-6 text-center border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white rounded-none"
                >
                  Upload Image
                </TabsTrigger>
                <TabsTrigger
                  value="extract"
                  className="flex-1 py-4 px-6 text-center border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white rounded-none"
                >
                  Extract Text
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  className="flex-1 py-4 px-6 text-center border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white rounded-none"
                >
                  Results
                </TabsTrigger>
              </div>
            </TabsList>

            {/* Tab Contents */}
            <TabsContent value="upload" className="p-8">
              <UploadTab />
            </TabsContent>

            <TabsContent value="extract" className="p-8">
              <ExtractTab />
            </TabsContent>

            <TabsContent value="results" className="p-8">
              <ResultsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
