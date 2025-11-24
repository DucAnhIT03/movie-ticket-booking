import React, { useState, useEffect } from "react";
import { X, Upload, XCircle, Bold, Italic, List, Link2, Image as ImageIcon, Table, AlignLeft, AlignCenter, AlignRight, Minus, Square } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Table as TableExtension } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Plugin } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";
import { TextStyle } from "@tiptap/extension-text-style";
import { Extension } from "@tiptap/core";
import Color from "@tiptap/extension-color";
import "./NewsModal.css";
import uploadService from "../../services/uploads/uploadService";

export default function NewsModal({ title, onClose, onSave, initialData, isSaving = false }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: null,
    imageUrl: "",
    displayPage: "news", // "news" hoặc "ticket-price"
  });
  const [errors, setErrors] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingEditorImage, setUploadingEditorImage] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableSize, setTableSize] = useState({ rows: 0, cols: 0 });
  const [showBorderMenu, setShowBorderMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false, // Disable Link trong StarterKit để tránh duplicate
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "tiptap-link",
        },
      }),
      Placeholder.configure({
        placeholder: "Nhập nội dung tin tức...",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Extension.create({
        name: 'fontSize',
        addOptions() {
          return {
            types: ['textStyle'],
          };
        },
        addGlobalAttributes() {
          return [
            {
              types: this.options.types,
              attributes: {
                fontSize: {
                  default: null,
                  parseHTML: element => element.style.fontSize || null,
                  renderHTML: attributes => {
                    if (!attributes.fontSize) {
                      return {};
                    }
                    return {
                      style: `font-size: ${attributes.fontSize}`,
                    };
                  },
                },
              },
            },
          ];
        },
        addCommands() {
          return {
            setFontSize: (fontSize) => ({ chain }) => {
              return chain()
                .setMark('textStyle', { fontSize })
                .run();
            },
            unsetFontSize: () => ({ chain }) => {
              return chain()
                .setMark('textStyle', { fontSize: null })
                .removeEmptyTextStyle()
                .run();
            },
          };
        },
      }),
      TableExtension.extend({
        addProseMirrorPlugins() {
          // Lấy plugins mặc định từ parent (bao gồm resize plugin)
          const parentPlugins = this.parent?.() || [];
          
          // Filter và thay thế cell selection plugin
          const modifiedPlugins = parentPlugins.map(plugin => {
            const pluginKey = plugin.key;
            // Nếu là cell selection plugin, thay thế bằng plugin rỗng
            if (pluginKey && (pluginKey.toString().includes('cellSelection') || 
                pluginKey.toString().includes('tableCellSelection'))) {
              return new Plugin({
                key: pluginKey,
                state: {
                  init: () => DecorationSet.empty,
                  apply: () => DecorationSet.empty,
                },
                props: {
                  decorations: () => DecorationSet.empty,
                },
              });
            }
            return plugin;
          });
          
          // Thêm plugin tùy chỉnh để chặn cell selection nhưng cho phép resize
          modifiedPlugins.push(
            new Plugin({
              key: 'disableCellSelection',
              props: {
                handleDOMEvents: {
                  mousedown: (view, event) => {
                    const target = event.target;
                    // Cho phép resize handle hoạt động
                    if (target?.classList?.contains('column-resize-handle') || 
                        target?.closest('.column-resize-handle') ||
                        target?.classList?.contains('resize-cursor') ||
                        target?.closest('.resize-cursor')) {
                      return false; // Cho phép resize
                    }
                    const table = target?.closest('table');
                    if (table && (event.shiftKey || event.ctrlKey || event.metaKey)) {
                      // Ngăn chặn cell selection với modifier keys
                      event.preventDefault();
                      event.stopPropagation();
                      return true;
                    }
                    return false;
                  },
                },
              },
            })
          );
          
          return modifiedPlugins;
        },
      }).configure({
        resizable: true, // Bật lại resize
        allowTableNodeSelection: false,
        HTMLAttributes: {
          class: "tiptap-table",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "tiptap-table-row",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "tiptap-table-header",
        },
      }),
      TableCell.extend({
        selectable: false,
        // Override để ngăn chặn cell selection
        addAttributes() {
          return {
            ...this.parent?.(),
            // Không cho phép cell selection
          };
        },
      }).configure({
        HTMLAttributes: {
          class: "tiptap-table-cell",
        },
      }),
    ],
    content: "",
    editable: !isSaving,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
      handleDOMEvents: {
        // Ngăn chặn drag selection trong table nhưng cho phép click bình thường và resize
        mousedown: (view, event) => {
          const target = event.target;
          // Cho phép click vào border menu và các button
          if (target?.closest('.border-menu') || target?.closest('.tiptap-btn') || target?.closest('.table-picker')) {
            return false;
          }
          
          // Cho phép resize handle hoạt động
          if (target?.classList?.contains('column-resize-handle') || 
              target?.closest('.column-resize-handle') ||
              target?.classList?.contains('resize-cursor') ||
              target?.closest('.resize-cursor')) {
            return false; // Cho phép resize
          }
          
          const table = target?.closest('.tiptap-table') || target?.closest('table');
          if (table) {
            const cell = target?.closest('td, th');
            if (cell) {
              // Ngăn chặn mousedown với shift hoặc ctrl để tránh cell selection
              if (event.shiftKey || event.ctrlKey || event.metaKey) {
                event.preventDefault();
                event.stopPropagation();
                return true;
              }
              // Cho phép click đơn vào cell
              return false;
            }
          }
          return false;
        },
        // Ngăn chặn selectstart khi drag qua nhiều cell
        selectstart: (view, event) => {
          const target = event.target;
          // Cho phép select trong border menu
          if (target?.closest('.border-menu') || target?.closest('.tiptap-btn') || target?.closest('.table-picker')) {
            return false;
          }
          
          const table = target?.closest('.tiptap-table') || target?.closest('table');
          if (table) {
            const cell = target?.closest('td, th');
            // Nếu đang ở trong cell, cho phép select text
            if (cell && cell.contains(target)) {
              // Kiểm tra xem có đang cố drag qua nhiều cell không
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const startCell = range.startContainer?.closest?.('td, th');
                const endCell = range.endContainer?.closest?.('td, th');
                // Nếu start và end ở khác cell, ngăn chặn
                if (startCell && endCell && startCell !== endCell) {
                  event.preventDefault();
                  event.stopPropagation();
                  return true; // Ngăn chặn
                }
              }
              return false; // Cho phép select text trong cùng một cell
            }
            // Nếu không, ngăn chặn selection
            return true;
          }
          return false;
        },
        // Ngăn chặn mousemove khi drag trong table
        mousemove: (view, event) => {
          const target = event.target;
          const table = target?.closest('.tiptap-table') || target?.closest('table');
          if (table && event.buttons === 1) {
            // Nếu đang drag trong table, kiểm tra xem có đang drag qua nhiều cell không
            const cell = target?.closest('td, th');
            if (cell) {
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const startCell = range.startContainer?.closest?.('td, th');
                const endCell = range.endContainer?.closest?.('td, th');
                // Nếu start và end ở khác cell, ngăn chặn
                if (startCell && endCell && startCell !== endCell) {
                  event.preventDefault();
                  event.stopPropagation();
                  return true;
                }
              }
            }
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Lưu content không có displayPage tag (sẽ thêm lại khi save)
      const cleanContent = html.replace(/<!--DISPLAY_PAGE:ticket-price-->/g, '');
      setFormData((prev) => ({
        ...prev,
        content: cleanContent,
      }));
      // Xóa lỗi khi người dùng bắt đầu nhập
      if (errors.content) {
        setErrors((prev) => ({
          ...prev,
          content: "",
        }));
      }
    },
  });

  // Update editor editable state when isSaving changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isSaving);
    }
  }, [isSaving, editor]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        content: initialData.content || "",
        image: null,
        imageUrl: initialData.image || "",
        displayPage: initialData.displayPage || initialData.display_page || initialData.metadata?.displayPage || "news",
      });
      setImagePreview(initialData.image || "");
      // Set editor content (xóa displayPage tag khi load vào editor)
      if (editor && initialData.content) {
        const contentForEditor = initialData.content.replace(/<!--DISPLAY_PAGE:ticket-price-->/g, '');
        editor.commands.setContent(contentForEditor);
      }
    } else {
      setFormData({
        title: "",
        content: "",
        image: null,
        imageUrl: "",
        displayPage: "news",
      });
      setImagePreview("");
      // Clear editor content
      if (editor) {
        editor.commands.clearContent();
      }
    }
    setErrors({});
  }, [initialData, editor]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files && files.length > 0) {
      // Xử lý file upload
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        [name]: file,
        imageUrl: "", // Xóa URL cũ khi chọn file mới
      }));
      // Tạo preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Xóa lỗi khi người dùng bắt đầu nhập
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
      imageUrl: "",
    }));
    setImagePreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề không được để trống";
    }
    if (formData.title.length > 255) {
      newErrors.title = "Tiêu đề không được vượt quá 255 ký tự";
    }
    if (!formData.displayPage) {
      newErrors.displayPage = "Vui lòng chọn trang hiển thị";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Upload ảnh nếu có file mới
    let imageUrl = formData.imageUrl;
    if (formData.image && typeof formData.image === 'object') {
      setUploadingImage(true);
      try {
        const uploadResponse = await uploadService.uploadSingle(
          formData.image,
          "news",
          "news",
          "image"
        );
        if (uploadResponse.status === 200 || uploadResponse.status === 201) {
          imageUrl = uploadResponse.data.url || uploadResponse.data.secure_url;
        } else {
          alert("Có lỗi xảy ra khi upload ảnh");
          setUploadingImage(false);
          return;
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Có lỗi xảy ra khi upload ảnh");
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    // Lưu displayPage vào content với một comment đặc biệt để tự động sync
    let finalContent = formData.content || "";
    const displayPageTag = `<!--DISPLAY_PAGE:ticket-price-->`;
    
    if (formData.displayPage === "ticket-price") {
      // Thêm comment vào đầu content để đánh dấu (nếu chưa có)
      if (!finalContent.includes(displayPageTag)) {
        finalContent = displayPageTag + finalContent;
        console.log("✅ NewsModal - Đã thêm tag DISPLAY_PAGE:ticket-price vào content");
      } else {
        console.log("✅ NewsModal - Tag DISPLAY_PAGE:ticket-price đã có trong content");
      }
    } else {
      // Xóa tag nếu không phải ticket-price
      const beforeLength = finalContent.length;
      finalContent = finalContent.replace(/<!--\s*DISPLAY_PAGE\s*:\s*ticket-price\s*-->/gi, '');
      if (finalContent.length < beforeLength) {
        console.log("✅ NewsModal - Đã xóa tag DISPLAY_PAGE:ticket-price khỏi content");
      }
    }

    // Gọi onSave với dữ liệu (không có festivalId vì tin tức độc lập)
    const dataToSave = {
      title: formData.title,
      content: finalContent, // Content đã có tag displayPage
      image: imageUrl || null,
      displayPage: formData.displayPage,
      display_page: formData.displayPage,
      id: initialData?.id,
    };
    console.log("NewsModal - Saving data with displayPage:", formData.displayPage);
    onSave(dataToSave);
  };

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        try {
          editor.destroy();
        } catch (error) {
          console.warn("Error destroying editor:", error);
        }
      }
    };
  }, [editor]);

  // Close table picker and border menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTablePicker && !event.target.closest(".table-picker") && !event.target.closest(".tiptap-btn")) {
        setShowTablePicker(false);
        setTableSize({ rows: 0, cols: 0 });
      }
      if (showBorderMenu && !event.target.closest(".border-menu") && !event.target.closest(".tiptap-btn")) {
        setShowBorderMenu(false);
      }
      if (showFontSizeMenu && !event.target.closest(".font-size-menu") && !event.target.closest(".tiptap-btn")) {
        setShowFontSizeMenu(false);
      }
      if (showColorMenu && !event.target.closest(".color-menu") && !event.target.closest(".tiptap-btn")) {
        setShowColorMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTablePicker, showBorderMenu, showFontSizeMenu, showColorMenu]);

  // Helper function to merge cells
  const mergeCells = () => {
    if (!editor) return;
    
    editor.chain().focus().command(({ tr, state, dispatch }) => {
      const { selection } = state;
      const { $anchor } = selection;
      
      // Tìm cell hiện tại
      let cellPos = null;
      let cell = null;
      
      for (let depth = $anchor.depth; depth > 0; depth--) {
        const node = $anchor.node(depth);
        if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
          cell = node;
          cellPos = $anchor.before(depth);
          break;
        }
      }
      
      if (!cell || cellPos === null) return false;
      
      // Tìm table và row
      let tablePos = null;
      let table = null;
      let rowPos = null;
      let row = null;
      
      for (let depth = $anchor.depth; depth > 0; depth--) {
        const node = $anchor.node(depth);
        if (node.type.name === 'table') {
          table = node;
          tablePos = $anchor.before(depth);
          break;
        }
        if (node.type.name === 'tableRow') {
          row = node;
          rowPos = $anchor.before(depth);
        }
      }
      
      if (!table || !row) return false;
      
      // Tìm vị trí của cell trong row
      let cellIndex = -1;
      let currentPos = rowPos + 1;
      for (let i = 0; i < row.childCount; i++) {
        const child = row.child(i);
        if (currentPos <= cellPos && cellPos < currentPos + child.nodeSize) {
          cellIndex = i;
          break;
        }
        currentPos += child.nodeSize;
      }
      
      if (cellIndex === -1 || cellIndex >= row.childCount - 1) return false;
      
      // Merge với cell bên phải (nếu có)
      const nextCell = row.child(cellIndex + 1);
      let nextCellPos = currentPos;
      // Tính nextCellPos chính xác
      for (let i = 0; i <= cellIndex; i++) {
        if (i === 0) {
          nextCellPos = rowPos + 1;
        } else {
          nextCellPos += row.child(i - 1).nodeSize;
        }
      }
      nextCellPos += cell.nodeSize;
      
      const currentColspan = cell.attrs.colspan || 1;
      const nextColspan = nextCell.attrs.colspan || 1;
      
      // Lấy nội dung từ cell tiếp theo và thêm vào cell hiện tại (nếu có)
      const nextCellContent = nextCell.textContent || '';
      const currentContent = cell.textContent || '';
      
      // Tăng colspan của cell hiện tại
      tr.setNodeMarkup(cellPos, null, {
        ...cell.attrs,
        colspan: currentColspan + nextColspan,
      });
      
      // Xóa cell tiếp theo
      tr.delete(nextCellPos, nextCellPos + nextCell.nodeSize);
      
      if (dispatch) dispatch(tr);
      return true;
    }).run();
  };

  // Helper function to merge cells vertically (merge với cell dưới)
  const mergeCellsVertical = () => {
    if (!editor) return;
    
    editor.chain().focus().command(({ tr, state, dispatch }) => {
      const { selection } = state;
      const { $anchor } = selection;
      
      // Tìm cell hiện tại
      let cellPos = null;
      let cell = null;
      
      for (let depth = $anchor.depth; depth > 0; depth--) {
        const node = $anchor.node(depth);
        if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
          cell = node;
          cellPos = $anchor.before(depth);
          break;
        }
      }
      
      if (!cell || cellPos === null) return false;
      
      // Tìm table và row
      let tablePos = null;
      let table = null;
      let rowPos = null;
      let row = null;
      let rowIndex = 0;
      
      for (let depth = $anchor.depth; depth > 0; depth--) {
        const node = $anchor.node(depth);
        if (node.type.name === 'table') {
          table = node;
          tablePos = $anchor.before(depth);
        }
        if (node.type.name === 'tableRow') {
          row = node;
          rowPos = $anchor.before(depth);
          // Tìm row index
          if (table) {
            for (let i = 0; i < table.childCount; i++) {
              if (table.child(i) === row) {
                rowIndex = i;
                break;
              }
            }
          }
        }
      }
      
      if (!table || !row || rowIndex >= table.childCount - 1) return false;
      
      // Tìm cell ở cùng vị trí trong row dưới
      const nextRow = table.child(rowIndex + 1);
      const nextRowPos = rowPos + row.nodeSize;
      
      // Tìm cell index trong row hiện tại (tính cả colspan)
      let cellIndex = -1;
      let currentPos = rowPos + 1;
      let actualColIndex = 0;
      
      for (let i = 0; i < row.childCount; i++) {
        const child = row.child(i);
        const childColspan = child.attrs.colspan || 1;
        
        if (currentPos <= cellPos && cellPos < currentPos + child.nodeSize) {
          cellIndex = actualColIndex;
          break;
        }
        
        currentPos += child.nodeSize;
        actualColIndex += childColspan;
      }
      
      if (cellIndex === -1) return false;
      
      // Tìm cell tương ứng trong row dưới (tính cả colspan)
      let nextCellPos = nextRowPos + 1;
      let nextCell = null;
      let actualCellIndex = 0;
      
      for (let i = 0; i < nextRow.childCount; i++) {
        const child = nextRow.child(i);
        const childColspan = child.attrs.colspan || 1;
        
        if (actualCellIndex <= cellIndex && cellIndex < actualCellIndex + childColspan) {
          nextCell = child;
          // Tính chính xác nextCellPos
          nextCellPos = nextRowPos + 1;
          for (let j = 0; j < i; j++) {
            nextCellPos += nextRow.child(j).nodeSize;
          }
          break;
        }
        
        actualCellIndex += childColspan;
      }
      
      if (!nextCell) return false;
      
      const currentRowspan = cell.attrs.rowspan || 1;
      const nextRowspan = nextCell.attrs.rowspan || 1;
      
      // Lấy nội dung từ cell dưới và thêm vào cell hiện tại (nếu có)
      const nextCellContent = nextCell.textContent || '';
      const currentContent = cell.textContent || '';
      
      // Tăng rowspan của cell hiện tại
      tr.setNodeMarkup(cellPos, null, {
        ...cell.attrs,
        rowspan: currentRowspan + nextRowspan,
      });
      
      // Xóa cell dưới
      tr.delete(nextCellPos, nextCellPos + nextCell.nodeSize);
      
      if (dispatch) dispatch(tr);
      return true;
    }).run();
  };

  // Helper function to split merged cell
  const splitCell = () => {
    if (!editor) return;
    
    editor.chain().focus().command(({ tr, state, dispatch }) => {
      const { selection } = state;
      const { $anchor } = selection;
      
      // Tìm cell hiện tại
      let cellPos = null;
      let cell = null;
      
      for (let depth = $anchor.depth; depth > 0; depth--) {
        const node = $anchor.node(depth);
        if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
          cell = node;
          cellPos = $anchor.before(depth);
          break;
        }
      }
      
      if (!cell || cellPos === null) return false;
      
      const colspan = cell.attrs.colspan || 1;
      const rowspan = cell.attrs.rowspan || 1;
      
      // Nếu cell không được merge, không làm gì
      if (colspan === 1 && rowspan === 1) return false;
      
      // Reset colspan và rowspan về 1
      tr.setNodeMarkup(cellPos, null, {
        ...cell.attrs,
        colspan: 1,
        rowspan: 1,
      });
      
      if (dispatch) dispatch(tr);
      return true;
    }).run();
  };

  // Helper function to apply border to current cell
  const applyBorder = (borderStyle) => {
    if (!editor) return;
    
    editor.chain().focus().command(({ tr, state, dispatch }) => {
      const { selection } = state;
      const { $anchor } = selection;
      
      // Tìm cell chứa cursor
      let cellPos = null;
      let cell = null;
      
      // Tìm node tableCell hoặc tableHeader
      for (let depth = $anchor.depth; depth > 0; depth--) {
        const node = $anchor.node(depth);
        if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
          cell = node;
          cellPos = $anchor.before(depth);
          break;
        }
      }
      
      if (cell && cellPos !== null) {
        const currentStyle = cell.attrs.style || '';
        let newStyle = currentStyle;
        
        // Nếu borderStyle rỗng, xóa tất cả border (No Border)
        if (borderStyle.trim() === '') {
          newStyle = newStyle.replace(/border[^:]*:\s*[^;]+;?/gi, '').trim();
        } else {
          // Xóa border cũ tương ứng
          if (borderStyle.includes('border-bottom')) {
            newStyle = newStyle.replace(/border-bottom:\s*[^;]+;?/gi, '');
          }
          if (borderStyle.includes('border-top')) {
            newStyle = newStyle.replace(/border-top:\s*[^;]+;?/gi, '');
          }
          if (borderStyle.includes('border-left')) {
            newStyle = newStyle.replace(/border-left:\s*[^;]+;?/gi, '');
          }
          if (borderStyle.includes('border-right')) {
            newStyle = newStyle.replace(/border-right:\s*[^;]+;?/gi, '');
          }
          if (borderStyle.includes('border:')) {
            // Xóa tất cả border
            newStyle = newStyle.replace(/border[^:]*:\s*[^;]+;?/gi, '');
          }
          
          // Thêm border mới
          newStyle = (newStyle.trim() + ' ' + borderStyle).trim();
        }
        
        tr.setNodeMarkup(cellPos, null, {
          ...cell.attrs,
          style: newStyle
        });
        
        if (dispatch) dispatch(tr);
      }
      return true;
    }).run();
    setShowBorderMenu(false);
  };

  return (
    <div className="news-modal-overlay" onClick={onClose}>
      <div className="news-modal" onClick={(e) => e.stopPropagation()}>
        <div className="news-modal-header">
          <h2>{title}</h2>
          <button className="news-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="news-modal-form">
          <div className="news-modal-field">
            <label>
              Tiêu đề <span style={{ color: "#e53935" }}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Nhập tiêu đề tin tức"
              maxLength={255}
              disabled={isSaving}
            />
            {errors.title && (
              <span className="news-modal-error">{errors.title}</span>
            )}
          </div>

          <div className="news-modal-field">
            <label>Nội dung</label>
            {editor && (
              <div className="tiptap-wrapper">
                {/* Toolbar */}
                <div className="tiptap-toolbar">
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={isSaving || !editor.isEditable}
                    className={editor.isActive("bold") ? "tiptap-btn active" : "tiptap-btn"}
                    title="Bold"
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={isSaving || !editor.isEditable}
                    className={editor.isActive("italic") ? "tiptap-btn active" : "tiptap-btn"}
                    title="Italic"
                  >
                    <Italic size={16} />
                  </button>
                  <div className="tiptap-toolbar-divider" />
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
                      disabled={isSaving || !editor.isEditable}
                      className="tiptap-btn"
                      title="Cỡ chữ"
                    >
                      <span style={{ fontSize: "12px" }}>A</span>
                      <span style={{ fontSize: "10px", marginLeft: "2px" }}>▼</span>
                    </button>
                    {showFontSizeMenu && (
                      <div className="font-size-menu">
                        {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              editor.chain().focus().setFontSize(`${size}px`).run();
                              setShowFontSizeMenu(false);
                            }}
                            className="font-size-menu-item"
                            style={{
                              fontSize: `${Math.min(size, 16)}px`,
                              fontWeight: 'normal',
                            }}
                          >
                            <span style={{ fontSize: `${size}px` }}>A</span>
                            <span style={{ fontSize: '11px', marginLeft: '4px' }}>{size}px</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="tiptap-toolbar-divider" />
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setShowColorMenu(!showColorMenu)}
                      disabled={isSaving || !editor.isEditable}
                      className="tiptap-btn"
                      title="Màu chữ"
                      style={{
                        position: "relative",
                      }}
                    >
                      <span style={{ 
                        fontSize: "14px",
                        color: editor.getAttributes('textStyle').color || '#fff'
                      }}>
                        A
                      </span>
                      <span style={{ 
                        fontSize: "8px", 
                        marginLeft: "2px",
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        backgroundColor: editor.getAttributes('textStyle').color || '#fff',
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: "2px"
                      }}></span>
                    </button>
                    {showColorMenu && (
                      <div className="color-menu">
                        <div className="color-menu-grid">
                          {[
                            '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
                            '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
                            '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
                            '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
                            '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
                            '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
                            '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
                            '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'
                          ].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => {
                                editor.chain().focus().setColor(color).run();
                                setShowColorMenu(false);
                              }}
                              className="color-menu-item"
                              style={{
                                backgroundColor: color,
                                border: editor.getAttributes('textStyle').color === color ? '2px solid #667eea' : '1px solid rgba(255, 255, 255, 0.2)',
                              }}
                              title={color}
                            />
                          ))}
                        </div>
                        <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                          <input
                            type="color"
                            value={editor.getAttributes('textStyle').color || '#ffffff'}
                            onChange={(e) => {
                              editor.chain().focus().setColor(e.target.value).run();
                            }}
                            style={{
                              width: "100%",
                              height: "32px",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="tiptap-toolbar-divider" />
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    disabled={isSaving || !editor.isEditable}
                    className={editor.isActive("heading", { level: 1 }) ? "tiptap-btn active" : "tiptap-btn"}
                    title="Heading 1"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    disabled={isSaving || !editor.isEditable}
                    className={editor.isActive("heading", { level: 2 }) ? "tiptap-btn active" : "tiptap-btn"}
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    disabled={isSaving || !editor.isEditable}
                    className={editor.isActive("heading", { level: 3 }) ? "tiptap-btn active" : "tiptap-btn"}
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <div className="tiptap-toolbar-divider" />
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    disabled={isSaving || !editor.isEditable}
                    className={editor.isActive("bulletList") ? "tiptap-btn active" : "tiptap-btn"}
                    title="Bullet List"
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    disabled={isSaving || !editor.isEditable}
                    className={editor.isActive("orderedList") ? "tiptap-btn active" : "tiptap-btn"}
                    title="Ordered List"
                  >
                    1.
                  </button>
                  <div className="tiptap-toolbar-divider" />
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    disabled={isSaving || !editor.isEditable}
                    className={editor.isActive({ textAlign: "left" }) ? "tiptap-btn active" : "tiptap-btn"}
                    title="Căn trái"
                  >
                    <AlignLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    disabled={isSaving || !editor.isEditable}
                    className={editor.isActive({ textAlign: "center" }) ? "tiptap-btn active" : "tiptap-btn"}
                    title="Căn giữa"
                  >
                    <AlignCenter size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    disabled={isSaving || !editor.isEditable}
                    className={editor.isActive({ textAlign: "right" }) ? "tiptap-btn active" : "tiptap-btn"}
                    title="Căn phải"
                  >
                    <AlignRight size={16} />
                  </button>
                  <div className="tiptap-toolbar-divider" />
                  <button
                    type="button"
                    onClick={() => {
                      const previousUrl = editor.getAttributes("link").href;
                      const url = window.prompt(
                        previousUrl ? `Chỉnh sửa link (hiện tại: ${previousUrl}):` : "Nhập URL:",
                        previousUrl || ""
                      );
                      if (url === null) return; // User cancelled
                      if (url) {
                        editor.chain().focus().setLink({ href: url }).run();
                      } else {
                        editor.chain().focus().unsetLink().run();
                      }
                    }}
                    disabled={isSaving || !editor.isEditable}
                    className={editor.isActive("link") ? "tiptap-btn active" : "tiptap-btn"}
                    title="Chèn/Sửa Link"
                  >
                    <Link2 size={16} />
                  </button>
                  <input
                    type="file"
                    id="editor-image-upload"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setUploadingEditorImage(true);
                      try {
                        const uploadResponse = await uploadService.uploadSingle(
                          file,
                          "news",
                          "news",
                          "image"
                        );
                        if (uploadResponse.status === 200 || uploadResponse.status === 201) {
                          const imageUrl = uploadResponse.data.url || uploadResponse.data.secure_url;
                          editor.chain().focus().setImage({ src: imageUrl }).run();
                        } else {
                          alert("Có lỗi xảy ra khi upload ảnh");
                        }
                      } catch (error) {
                        console.error("Error uploading image:", error);
                        alert("Có lỗi xảy ra khi upload ảnh");
                      } finally {
                        setUploadingEditorImage(false);
                        // Reset input để có thể chọn lại file cùng tên
                        e.target.value = "";
                      }
                    }}
                    disabled={isSaving || uploadingEditorImage}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("editor-image-upload")?.click();
                    }}
                    disabled={isSaving || !editor.isEditable || uploadingEditorImage}
                    className="tiptap-btn"
                    title={uploadingEditorImage ? "Đang upload..." : "Chèn ảnh"}
                  >
                    {uploadingEditorImage ? (
                      <span style={{ fontSize: "12px" }}>...</span>
                    ) : (
                      <ImageIcon size={16} />
                    )}
                  </button>
                  <div className="tiptap-toolbar-divider" />
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setShowTablePicker(!showTablePicker)}
                      disabled={isSaving || !editor.isEditable}
                      className={editor.isActive("table") ? "tiptap-btn active" : "tiptap-btn"}
                      title="Chèn bảng"
                    >
                      <Table size={16} />
                    </button>
                    {showTablePicker && (
                      <div className="table-picker">
                        <div className="table-picker-grid">
                          {Array.from({ length: 10 }).map((_, rowIndex) =>
                            Array.from({ length: 10 }).map((_, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`table-picker-cell ${
                                  rowIndex < tableSize.rows && colIndex < tableSize.cols
                                    ? "selected"
                                    : ""
                                }`}
                                onMouseEnter={() =>
                                  setTableSize({ rows: rowIndex + 1, cols: colIndex + 1 })
                                }
                                onClick={() => {
                                  if (rowIndex + 1 > 0 && colIndex + 1 > 0) {
                                    editor
                                      .chain()
                                      .focus()
                                      .insertTable({
                                        rows: rowIndex + 1,
                                        cols: colIndex + 1,
                                        withHeaderRow: true,
                                      })
                                      .run();
                                    setShowTablePicker(false);
                                    setTableSize({ rows: 0, cols: 0 });
                                  }
                                }}
                              />
                            ))
                          )}
                        </div>
                        <div className="table-picker-label">
                          {tableSize.rows > 0 && tableSize.cols > 0
                            ? `${tableSize.rows} × ${tableSize.cols}`
                            : "Chọn kích thước bảng"}
                        </div>
                      </div>
                    )}
                  </div>
                  {editor?.isActive("table") && (
                    <>
                      <div className="tiptap-toolbar-divider" />
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().addRowBefore().run()}
                        disabled={isSaving || !editor.isEditable}
                        className="tiptap-btn"
                        title="Thêm hàng trên"
                      >
                        +↑
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().addRowAfter().run()}
                        disabled={isSaving || !editor.isEditable}
                        className="tiptap-btn"
                        title="Thêm hàng dưới"
                      >
                        +↓
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().deleteRow().run()}
                        disabled={isSaving || !editor.isEditable}
                        className="tiptap-btn"
                        title="Xóa hàng"
                      >
                        -H
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().addColumnBefore().run()}
                        disabled={isSaving || !editor.isEditable}
                        className="tiptap-btn"
                        title="Thêm cột trái"
                      >
                        +←
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().addColumnAfter().run()}
                        disabled={isSaving || !editor.isEditable}
                        className="tiptap-btn"
                        title="Thêm cột phải"
                      >
                        +→
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().deleteColumn().run()}
                        disabled={isSaving || !editor.isEditable}
                        className="tiptap-btn"
                        title="Xóa cột"
                      >
                        -C
                      </button>
                      <div className="tiptap-toolbar-divider" />
                      <button
                        type="button"
                        onClick={mergeCells}
                        disabled={isSaving || !editor.isEditable}
                        className="tiptap-btn"
                        title="Hợp nhất ô ngang (Merge Right)"
                      >
                        ⇄
                      </button>
                      <button
                        type="button"
                        onClick={mergeCellsVertical}
                        disabled={isSaving || !editor.isEditable}
                        className="tiptap-btn"
                        title="Hợp nhất ô dọc (Merge Down)"
                      >
                        ⇅
                      </button>
                      <button
                        type="button"
                        onClick={splitCell}
                        disabled={isSaving || !editor.isEditable}
                        className="tiptap-btn"
                        title="Tách ô đã hợp nhất (Split Cell)"
                      >
                        ⤢
                      </button>
                      <div className="tiptap-toolbar-divider" />
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Bạn chắc chắn muốn xóa bảng này?")) {
                            editor.chain().focus().deleteTable().run();
                          }
                        }}
                        disabled={isSaving || !editor.isEditable}
                        className="tiptap-btn"
                        title="Xóa bảng"
                        style={{ color: "#e53935" }}
                      >
                        ×
                      </button>
                      <div className="tiptap-toolbar-divider" />
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          onClick={() => setShowBorderMenu(!showBorderMenu)}
                          disabled={isSaving || !editor.isEditable}
                          className="tiptap-btn"
                          title="Border"
                        >
                          <Square size={16} />
                        </button>
                        {showBorderMenu && (
                          <div className="border-menu" style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            background: "#1e2329",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "6px",
                            padding: "8px",
                            zIndex: 1000,
                            minWidth: "180px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                            marginTop: "4px"
                          }}>
                            <div style={{ 
                              display: "grid", 
                              gridTemplateColumns: "repeat(3, 1fr)", 
                              gap: "4px" 
                            }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  applyBorder('border-bottom: 2px solid #fff;');
                                }}
                                className="border-menu-item"
                                title="Bottom Border"
                              >
                                <div style={{ fontSize: "12px", padding: "4px" }}>└</div>
                                <span style={{ fontSize: "11px" }}>Bottom</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  applyBorder('border-top: 2px solid #fff;');
                                }}
                                className="border-menu-item"
                                title="Top Border"
                              >
                                <div style={{ fontSize: "12px", padding: "4px" }}>┌</div>
                                <span style={{ fontSize: "11px" }}>Top</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  applyBorder('border-left: 2px solid #fff;');
                                }}
                                className="border-menu-item"
                                title="Left Border"
                              >
                                <div style={{ fontSize: "12px", padding: "4px" }}>│</div>
                                <span style={{ fontSize: "11px" }}>Left</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  applyBorder('border-right: 2px solid #fff;');
                                }}
                                className="border-menu-item"
                                title="Right Border"
                              >
                                <div style={{ fontSize: "12px", padding: "4px" }}>│</div>
                                <span style={{ fontSize: "11px" }}>Right</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  applyBorder('');
                                }}
                                className="border-menu-item"
                                title="No Border"
                              >
                                <div style={{ fontSize: "12px", padding: "4px" }}>┌</div>
                                <span style={{ fontSize: "11px" }}>No Border</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  applyBorder('border: 2px solid #fff;');
                                }}
                                className="border-menu-item"
                                title="All Borders"
                              >
                                <div style={{ fontSize: "12px", padding: "4px" }}>┼</div>
                                <span style={{ fontSize: "11px" }}>All</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  applyBorder('border-top: 2px solid #fff; border-right: 2px solid #fff; border-bottom: 2px solid #fff; border-left: 2px solid #fff;');
                                }}
                                className="border-menu-item"
                                title="Outside Borders"
                              >
                                <div style={{ fontSize: "12px", padding: "4px" }}>┌─┐<br/>│ │<br/>└─┘</div>
                                <span style={{ fontSize: "11px" }}>Outside</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  applyBorder('border-top: 1px solid #fff; border-right: 1px solid #fff; border-bottom: 1px solid #fff; border-left: 1px solid #fff;');
                                }}
                                className="border-menu-item"
                                title="Inside Borders"
                              >
                                <div style={{ fontSize: "12px", padding: "4px" }}>┌─┬─┐<br/>├─┼─┤<br/>└─┴─┘</div>
                                <span style={{ fontSize: "11px" }}>Inside</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  applyBorder('border-top: 1px solid #fff; border-bottom: 1px solid #fff;');
                                }}
                                className="border-menu-item"
                                title="Inside Horizontal Border"
                              >
                                <div style={{ fontSize: "12px", padding: "4px" }}>─<br/>─</div>
                                <span style={{ fontSize: "11px" }}>H-Border</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  applyBorder('border-left: 1px solid #fff; border-right: 1px solid #fff;');
                                }}
                                className="border-menu-item"
                                title="Inside Vertical Border"
                              >
                                <div style={{ fontSize: "12px", padding: "4px" }}>│ │</div>
                                <span style={{ fontSize: "11px" }}>V-Border</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  applyBorder('border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 2px solid #fff; border-left: 1px solid transparent;');
                                }}
                                className="border-menu-item"
                                title="Diagonal Down Border"
                              >
                                <div style={{ fontSize: "12px", padding: "4px" }}>╲</div>
                                <span style={{ fontSize: "11px" }}>Diag Down</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  applyBorder('border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; background: linear-gradient(to top right, transparent 48%, #fff 49%, #fff 51%, transparent 52%);');
                                }}
                                className="border-menu-item"
                                title="Diagonal Up Border"
                              >
                                <div style={{ fontSize: "12px", padding: "4px" }}>╱</div>
                                <span style={{ fontSize: "11px" }}>Diag Up</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {/* Editor Content */}
                <div className="tiptap-editor-wrapper">
                  {editor && <EditorContent editor={editor} />}
                </div>
              </div>
            )}
            {errors.content && (
              <span className="news-modal-error">{errors.content}</span>
            )}
          </div>

          <div className="news-modal-field">
            <label>
              Hiển thị trên trang <span style={{ color: "#e53935" }}>*</span>
            </label>
            <select
              name="displayPage"
              value={formData.displayPage}
              onChange={handleChange}
              disabled={isSaving}
              className="news-modal-select"
            >
              <option value="news">Trang Tin Tức</option>
              <option value="ticket-price">Trang Giá Vé</option>
            </select>
            {errors.displayPage && (
              <span className="news-modal-error">{errors.displayPage}</span>
            )}
          </div>

          <div className="news-modal-field">
            <label>Ảnh tin tức</label>
            <div className="news-modal-image-upload">
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleChange}
                disabled={isSaving || uploadingImage}
                style={{ display: "none" }}
              />
              <label
                htmlFor="image"
                className="news-modal-upload-btn"
                style={{
                  opacity: isSaving || uploadingImage ? 0.6 : 1,
                  cursor: isSaving || uploadingImage ? "not-allowed" : "pointer",
                }}
              >
                <Upload size={18} />
                {uploadingImage ? "Đang upload..." : "Chọn ảnh"}
              </label>
              
              {(imagePreview || formData.imageUrl) && (
                <div className="news-modal-image-preview">
                  <img
                    src={imagePreview || formData.imageUrl}
                    alt="Preview"
                    className="news-modal-preview-img"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="news-modal-remove-img"
                    disabled={isSaving || uploadingImage}
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              )}
            </div>
            {errors.image && (
              <span className="news-modal-error">{errors.image}</span>
            )}
          </div>

          <div className="news-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="news-modal-btn news-modal-btn-cancel"
              disabled={isSaving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="news-modal-btn news-modal-btn-save"
              disabled={isSaving || uploadingImage}
            >
              {isSaving || uploadingImage ? "Đang xử lý..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

