"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useI18n } from "./I18nProvider"

export function GalleryView({ open, onOpenChange, images, currentId, onSelect }) {
    const { t } = useI18n()
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl, bg-white rounded-2xl shadow-xl p-4">
                <DialogHeader>
                    <DialogTitle>{t("Gallery")}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                    <div className="grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2">
                        {images.map((img) => (
                            <button
                                key={img.id}
                                onClick={() => onSelect(img.id)}
                                className={`group border rounded-md overflow-hidden text-left ${img.id === currentId ? "ring-2 ring-emerald-500" : "hover:shadow"}`}
                            >
                                <img
                                    src={img.url || "/placeholder.svg"}
                                    alt={img.name}
                                    className="w-full h-32 object-cover"
                                />
                                <div className="p-2">
                                    <div className="text-xs font-medium truncate">{img.name}</div>
                                    <div className="text-[10px] text-gray-500">{img.width}×{img.height}</div>
                                </div>
                            </button>
                        ))}
                        {images.length === 0 && (
                            <p className="text-sm text-gray-500 p-2">{t("annotate.noImages")}</p>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

GalleryView.defaultProps = {
    open: false,
    onOpenChange: () => { },
    images: [],
    currentId: null,
    onSelect: () => { },
}
