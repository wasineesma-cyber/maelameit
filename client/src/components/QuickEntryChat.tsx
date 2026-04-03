import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Camera,
  Send,
  X,
  Check,
  Loader2,
  ImagePlus,
  MessageCircle,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

interface ParsedItem {
  type: "income" | "expense";
  amount: number;
  description: string;
  categoryId: number | null;
}

interface Category {
  id: number;
  name: string;
  icon: string | null;
  type: string | null;
}

interface QuickEntryChatProps {
  lineUserId: string;
  categories: Category[];
  onSuccess: () => void;
}

export default function QuickEntryChat({ lineUserId, categories, onSuccess }: QuickEntryChatProps) {
  const [message, setMessage] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string>("image/jpeg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseMessage = trpc.ai.parseMessage.useMutation();
  const scanSlip = trpc.ai.scanSlip.useMutation();
  const uploadSlip = trpc.ai.uploadSlipImage.useMutation();
  const createTx = trpc.transactions.create.useMutation();

  const getCategoryIcon = (catId: number | null) => {
    if (!catId) return "📦";
    const cat = categories.find((c) => c.id === catId);
    return cat?.icon ?? "📦";
  };

  const getCategoryName = (catId: number | null) => {
    if (!catId) return "ไม่ระบุหมวด";
    const cat = categories.find((c) => c.id === catId);
    return cat?.name ?? "ไม่ระบุหมวด";
  };

  const handleSendText = async () => {
    if (!message.trim()) return;
    setIsProcessing(true);
    setParsedItems([]);
    try {
      const result = await parseMessage.mutateAsync({ lineUserId, message: message.trim() });
      if (result.items.length === 0) {
        toast.error("ไม่พบรายการ ลองพิมพ์ใหม่ เช่น 'ข้าว 80 grab 120'");
      } else {
        setParsedItems(result.items);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSelect = useCallback(async (file: File) => {
    if (file.size > 16 * 1024 * 1024) {
      toast.error("ไฟล์ใหญ่เกิน 16MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      setPreviewImage(dataUrl);
      setPreviewMime(file.type || "image/jpeg");
      setIsProcessing(true);
      setParsedItems([]);
      try {
        // อัปโหลดไปยัง S3 ก่อน แล้วส่ง URL ให้ AI
        const { url } = await uploadSlip.mutateAsync({
          lineUserId,
          imageBase64: base64,
          mimeType: file.type || "image/jpeg",
        });
        const result = await scanSlip.mutateAsync({ lineUserId, imageUrl: url });
        if (result.items.length === 0) {
          toast.error("อ่านสลิปไม่ได้ ลองถ่ายรูปใหม่ให้ชัดขึ้น");
        } else {
          setParsedItems(result.items);
        }
      } catch {
        toast.error("อ่านสลิปไม่สำเร็จ กรุณาลองใหม่");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [lineUserId, uploadSlip, scanSlip]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
    e.target.value = "";
  };

  const handleConfirmAll = async () => {
    if (parsedItems.length === 0) return;
    setIsProcessing(true);
    try {
      for (const item of parsedItems) {
        await createTx.mutateAsync({
          lineUserId,
          type: item.type,
          amount: item.amount,
          description: item.description,
          categoryId: item.categoryId ?? undefined,
          source: "web",
        });
      }
      toast.success(`บันทึก ${parsedItems.length} รายการแล้ว ✅`);
      setParsedItems([]);
      setMessage("");
      setPreviewImage(null);
      onSuccess();
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">จดด่วน</span>
        <span className="text-xs text-muted-foreground">พิมพ์หรือถ่ายรูปสลิป AI แยกให้เลย</span>
      </div>

      {/* Preview image */}
      {previewImage && (
        <div className="relative px-4 pt-3">
          <img src={previewImage} alt="slip" className="w-20 h-20 object-cover rounded-xl border border-border" />
          <button
            className="absolute top-2 right-3 bg-white rounded-full p-0.5 shadow border border-border"
            onClick={() => { setPreviewImage(null); setParsedItems([]); }}
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 px-3 py-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="พิมพ์ เช่น ข้าว 80  กาแฟ 45  เงินเดือน 25000"
          className="flex-1 resize-none text-sm bg-secondary/40 rounded-xl px-3 py-2.5 border-0 outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px] max-h-28 text-foreground placeholder:text-muted-foreground"
          rows={1}
          disabled={isProcessing}
        />
        {/* Camera button */}
        <Button
          size="icon"
          variant="outline"
          className="h-11 w-11 rounded-xl flex-shrink-0 border-border"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          title="ถ่ายรูปสลิป"
        >
          {isProcessing && previewImage ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
        {/* Send button */}
        <Button
          size="icon"
          className="h-11 w-11 rounded-xl flex-shrink-0 bg-primary hover:bg-primary/90"
          onClick={handleSendText}
          disabled={isProcessing || !message.trim()}
          title="ส่ง"
        >
          {isProcessing && !previewImage ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Parsed items preview */}
      {parsedItems.length > 0 && (
        <div className="border-t border-border px-3 pb-3 pt-2 space-y-2">
          <div className="text-xs text-muted-foreground font-medium px-1">AI แยกรายการได้ {parsedItems.length} รายการ — ยืนยันก่อนบันทึก</div>
          {parsedItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-secondary/40 rounded-xl px-3 py-2.5">
              <span className="text-lg">{getCategoryIcon(item.categoryId)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{item.description}</div>
                <div className="text-xs text-muted-foreground">{getCategoryName(item.categoryId)}</div>
              </div>
              <div className={`text-sm font-bold flex-shrink-0 flex items-center gap-1 ${item.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                {item.type === "income" ? (
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                )}
                ฿{item.amount.toLocaleString()}
              </div>
              <button onClick={() => handleRemoveItem(i)} className="text-muted-foreground hover:text-foreground ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <Button
            className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 gap-2 font-semibold"
            onClick={handleConfirmAll}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            บันทึก {parsedItems.length} รายการ
          </Button>
        </div>
      )}
    </div>
  );
}
