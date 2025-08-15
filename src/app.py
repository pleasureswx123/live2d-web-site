from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import json
import asyncio
import time
from loguru import logger
from core.llm_client import LLMClient
from core.websocket_manager import WebSocketManager
from core.file_manager import FileManager
from core.search_service import SearchService
from core.memory_engine import MemoryEngine  # 新增
from core.doubao_tts_client import DoubaoTTSClient  # 新增TTS客户端
from core.xfyun_asr_client import XFYunASRClient
from core.doubao_asr_client import DoubaoASRClient  # 新增ASR客户端
from contextlib import asynccontextmanager
import hashlib
from datetime import datetime
import time

# Global variables
llm_client = None
websocket_manager = None
file_manager = None
search_service = None
memory_engine = None  # 新增
tts_client = None  # 新增TTS客户端
xfyun_asr_client = None  # 讯飞ASR客户端
doubao_asr_client = None  # 豆包ASR客户端

# 用户ASR选择状态
user_asr_choice = {}  # user_id -> "xfyun" | "doubao"

def get_user_asr_client(user_id: str):
    """获取用户选择的ASR客户端"""
    choice = user_asr_choice.get(user_id, "xfyun")  # 默认使用讯飞
    if choice == "doubao" and doubao_asr_client and doubao_asr_client.is_available():
        return doubao_asr_client
    else:
        return xfyun_asr_client

def set_user_asr_choice(user_id: str, asr_type: str):
    """设置用户的ASR选择"""
    if asr_type in ["xfyun", "doubao"]:
        user_asr_choice[user_id] = asr_type
        logger.info(f"用户 {user_id} ASR选择: {asr_type}")
        return True
    return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm_client, websocket_manager, file_manager, search_service, memory_engine, tts_client, xfyun_asr_client, doubao_asr_client, user_asr_choice
    try:
        llm_client = LLMClient()
        websocket_manager = WebSocketManager()
        file_manager = FileManager()
        search_service = SearchService()
        memory_engine = MemoryEngine()  # 新增
        tts_client = DoubaoTTSClient()  # 新增TTS客户端
        xfyun_asr_client = XFYunASRClient()  # 讯飞ASR客户端
        doubao_asr_client = DoubaoASRClient()  # 豆包ASR客户端

        await llm_client.warm_up()
        await memory_engine.initialize()  # 新增
        await tts_client.warm_up()  # 新增TTS预热
        await xfyun_asr_client.warm_up()  # 讯飞ASR预热
        # 豆包ASR不需要预热，连接时自动初始化
        logger.info("数字人后端启动")
    except Exception as e:
        logger.error(f"启动失败: {e}")
        raise
    yield
    # 清理资源
    if memory_engine:
        if hasattr(memory_engine.user_profile_store, 'close'):
            await memory_engine.user_profile_store.close()
        if hasattr(memory_engine.short_term_memory, 'close'):
            await memory_engine.short_term_memory.close()
        if hasattr(memory_engine.long_term_memory, 'close'):
            await memory_engine.long_term_memory.close()
    logger.info("数字人后端关闭")

app = FastAPI(title="数字人后端", version="1.0.0", lifespan=lifespan)

# CORS设置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件服务
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "数字人后端运行中"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/status")
async def get_status():
    """获取系统状态"""
    global llm_client, websocket_manager

    if llm_client is None or websocket_manager is None:
        return {"status": "initializing"}

    return {
        "status": "running",
        "deep_reasoning": llm_client.get_deep_reasoning(),
        "is_warmed_up": llm_client.is_warmed_up,
        "mock_mode": llm_client.mock_mode if hasattr(llm_client, 'mock_mode') else False,
        "connections": websocket_manager.get_connection_count()
    }

@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """上传图片"""
    global file_manager

    logger.info(f"收到图片上传请求: {file.filename}, 类型: {file.content_type}, 大小: {file.size}")

    if file_manager is None:
        logger.error("文件管理器未初始化")
        return JSONResponse(status_code=500, content={"error": "文件管理器未初始化"})

    try:
        file_path = await file_manager.save_image(file)
        if file_path:
            file_url = file_manager.get_file_url(file_path)
            logger.info(f"图片上传成功: {file_path} -> {file_url}")
            return {"success": True, "file_path": file_path, "file_url": file_url}
        else:
            logger.error("图片保存失败 - save_image返回None")
            # 检查可能的原因
            if not file.content_type.startswith('image/'):
                return JSONResponse(status_code=400, content={"error": f"不支持的文件类型: {file.content_type}"})
            else:
                return JSONResponse(status_code=400, content={"error": "图片上传失败"})
    except Exception as e:
        logger.error(f"图片上传异常: {e}")
        return JSONResponse(status_code=500, content={"error": f"图片上传异常: {str(e)}"})

@app.post("/upload/file")
async def upload_file(file: UploadFile = File(...)):
    """上传文件"""
    global file_manager

    if file_manager is None:
        return JSONResponse(status_code=500, content={"error": "文件管理器未初始化"})

    file_path = await file_manager.save_file(file)
    if file_path:
        file_url = file_manager.get_file_url(file_path)
        return {"success": True, "file_path": file_path, "file_url": file_url}
    else:
        return JSONResponse(status_code=400, content={"error": "文件上传失败"})

@app.post("/control/deep_reasoning")
async def set_deep_reasoning(enabled: bool = Form(...)):
    """设置深度推理模式"""
    global llm_client

    if llm_client is None:
        return JSONResponse(status_code=500, content={"error": "LLM客户端未初始化"})

    llm_client.set_deep_reasoning(enabled)
    return {"success": True, "deep_reasoning": enabled}

@app.post("/control/warm_up")
async def warm_up_llm():
    global llm_client
    if llm_client is None:
        return JSONResponse(status_code=500, content={"error": "LLM客户端未初始化"})

    await llm_client.warm_up()
    return {"success": True, "is_warmed_up": llm_client.is_warmed_up}

@app.post("/search")
async def web_search(query: str = Form(...)):
    global search_service
    if search_service is None:
        return JSONResponse(status_code=500, content={"error": "搜索服务未初始化"})

    try:
        results = await search_service.search_web(query, max_results=3)
        formatted_results = search_service.format_search_results(results, query)
        return {
            "success": True,
            "query": query,
            "results": results,
            "formatted": formatted_results
        }
    except Exception as e:
        logger.error(f"搜索失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"搜索失败: {str(e)}"})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global websocket_manager, llm_client, memory_engine

    if websocket_manager is None or llm_client is None or memory_engine is None:
        await websocket.close(code=1011, reason="Service not ready")
        return

    await websocket.accept()
    websocket_manager.add_connection(websocket)

    # 等待接收用户ID
    user_id = None
    try:
        # 第一条消息应该包含用户ID
        init_data = await websocket.receive_text()
        init_message = json.loads(init_data)

        if init_message.get("type") == "init" and init_message.get("user_id"):
            user_id = init_message.get("user_id")
            logger.info(f"WebSocket用户初始化: {user_id}")

            # 重新添加连接以包含用户ID映射
            websocket_manager.remove_connection(websocket)
            websocket_manager.add_connection(websocket, user_id)

            # 发送初始化确认
            await websocket.send_text(json.dumps({
                "type": "init_success",
                "user_id": user_id,
                "message": "用户初始化成功"
            }))

            # 触发初始化主动对话（延迟2秒，让前端准备好）
            asyncio.create_task(trigger_init_proactive_chat(websocket, user_id))

            # 请求前端同步TTS设置
            await websocket.send_text(json.dumps({
                "type": "request_tts_settings",
                "message": "请同步TTS设置"
            }))
        else:
            # 如果没有提供用户ID，生成一个默认的
            user_id = f"user_{hash(str(websocket.client)) % 10000}"
            logger.warning(f"未提供用户ID，使用默认ID: {user_id}")

            # 重新添加连接以包含用户ID映射
            websocket_manager.remove_connection(websocket)
            websocket_manager.add_connection(websocket, user_id)

            # 初始化默认用户
            await memory_engine.initialize_user(user_id)

    except Exception as e:
        logger.error(f"WebSocket初始化失败: {e}")
        user_id = f"user_{hash(str(websocket.client)) % 10000}"

        # 重新添加连接以包含用户ID映射
        websocket_manager.remove_connection(websocket)
        websocket_manager.add_connection(websocket, user_id)

        await memory_engine.initialize_user(user_id)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "chat":
                user_message = message.get("content", "")
                image_url = message.get("image_url", None)
                search_query = message.get("search_query", None)
                await handle_chat_message(websocket, user_id, user_message, image_url, search_query)

            elif message.get("type") == "proactive_chat":
                # 处理主动对话（保留兼容性，但现在主要由后端自动触发）
                count = message.get("count", 0)
                is_follow_up = message.get("isFollowUp", False)
                follow_up_count = message.get("followUpCount", 0)
                trigger_type = message.get("trigger_type", "timer")  # 默认为timer类型
                await handle_proactive_chat(websocket, user_id, count, is_follow_up, follow_up_count, trigger_type)

            elif message.get("type") == "change_voice":
                # 处理音色切换
                new_voice = message.get("voice")
                if new_voice and tts_client:
                    await handle_voice_change(websocket, user_id, new_voice)
                else:
                    await websocket.send_text(json.dumps({
                        "type": "voice_change_error",
                        "error": "音色切换失败：无效的音色或TTS服务不可用"
                    }))

            elif message.get("type") == "change_speed":
                # 处理语速调节
                new_speed = message.get("speed")
                if new_speed and tts_client:
                    await handle_speed_change(websocket, user_id, new_speed)
                else:
                    await websocket.send_text(json.dumps({
                        "type": "speed_change_error",
                        "error": "语速调节失败：无效的语速或TTS服务不可用"
                    }))

            elif message.get("type") == "manual_stage_change":
                # 处理手动阶段调节
                new_stage = message.get("stage")
                if new_stage and llm_client:
                    await handle_manual_stage_change(websocket, user_id, new_stage)
                else:
                    await websocket.send_text(json.dumps({
                        "type": "manual_stage_error",
                        "error": "阶段调节失败：无效的阶段或服务不可用"
                    }))

            elif message.get("type") == "reset_stage_auto":
                # 重置为自动阶段模式
                if llm_client:
                    await handle_reset_stage_auto(websocket, user_id)
                else:
                    await websocket.send_text(json.dumps({
                        "type": "manual_stage_error",
                        "error": "重置失败：服务不可用"
                    }))

            elif message.get("type") == "sync_tts_settings":
                # 同步TTS设置
                voice = message.get("voice")
                speed = message.get("speed")
                if voice and tts_client:
                    await handle_voice_change(websocket, user_id, voice)
                if speed and tts_client:
                    await handle_speed_change(websocket, user_id, speed)

            elif message.get("type") == "start_asr":
                # 开始语音识别
                current_asr_client = get_user_asr_client(user_id)
                if current_asr_client:
                    await handle_start_asr(websocket, user_id)
                else:
                    await websocket.send_text(json.dumps({
                        "type": "asr_error",
                        "error": "ASR服务不可用"
                    }))

            elif message.get("type") == "audio_chunk":
                # 处理音频数据块
                audio_data = message.get("audio_data")
                current_asr_client = get_user_asr_client(user_id)
                if audio_data and current_asr_client:
                    await handle_audio_chunk(websocket, user_id, audio_data)
                else:
                    await websocket.send_text(json.dumps({
                        "type": "asr_error",
                        "error": "音频数据无效或ASR服务不可用"
                    }))

            elif message.get("type") == "stop_asr":
                # 停止语音识别
                current_asr_client = get_user_asr_client(user_id)
                if current_asr_client:
                    await handle_stop_asr(websocket, user_id)
                else:
                    await websocket.send_text(json.dumps({
                        "type": "asr_error",
                        "error": "ASR服务不可用"
                    }))

            elif message.get("type") == "change_asr":
                # 切换ASR服务
                asr_type = message.get("asr_type")
                if set_user_asr_choice(user_id, asr_type):
                    await websocket.send_text(json.dumps({
                        "type": "asr_change_success",
                        "asr_type": asr_type,
                        "message": f"ASR已切换为: {'豆包' if asr_type == 'doubao' else '讯飞'}"
                    }))
                else:
                    await websocket.send_text(json.dumps({
                        "type": "asr_change_error",
                        "error": "无效的ASR类型"
                    }))

            elif message.get("type") == "audio_playback_complete":
                # 音频播放完成，开始沉默检测
                logger.info(f"用户 {user_id} 音频播放完成，开始沉默检测")
                await handle_audio_playback_complete(user_id, websocket)

    except WebSocketDisconnect:
        websocket_manager.remove_connection(websocket)
    except Exception as e:
        # 1001是正常的连接关闭代码，不需要记录为错误
        if "1001" in str(e) and "going away" in str(e):
            logger.info(f"WebSocket正常关闭: {e}")
        else:
            logger.error(f"WebSocket错误: {e}")
        websocket_manager.remove_connection(websocket)

def remove_brackets_content(text: str) -> str:
    """
    移除文本中所有括号及其内容，专用于TTS处理
    移除的括号类型：()、（）、[]、【】、<>
    保留书名号：《》
    """
    import re

    # 定义需要移除的所有括号类型，使用更严格的匹配
    bracket_patterns = [
        r'\([^)]*\)',      # 英文圆括号 ()
        r'（[^）]*）',      # 中文圆括号 （）
        r'\[[^\]]*\]',     # 方括号 []
        r'【[^】]*】',      # 中文方括号 【】
        r'<[^>]*>',        # 尖括号 <>
        # 保留书名号 《》 不处理
    ]

    # 依次移除所有类型的括号内容，多次迭代处理嵌套括号
    cleaned_text = text
    max_iterations = 10  # 防止无限循环

    for _ in range(max_iterations):
        original_text = cleaned_text
        for pattern in bracket_patterns:
            cleaned_text = re.sub(pattern, '', cleaned_text)

        # 如果没有更多变化，说明处理完成
        if cleaned_text == original_text:
            break

    # 处理未闭合的括号 - 移除单独的括号字符
    orphan_brackets = [r'\(', r'\)', r'（', r'）', r'\[', r'\]', r'【', r'】', r'<', r'>']
    for bracket in orphan_brackets:
        cleaned_text = re.sub(bracket, '', cleaned_text)

    # 清理多余的空格和标点符号
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()

    # 清理多余的标点符号（如连续的逗号、句号等）
    cleaned_text = re.sub(r'[，,]{2,}', '，', cleaned_text)  # 多个逗号变成一个
    # 注意：不要清理省略号，保持 ... 或 。。。 的形式
    cleaned_text = re.sub(r'[。](?![。.])[。]+', '。', cleaned_text)  # 只清理非省略号的重复句号
    cleaned_text = re.sub(r'[！!]{2,}', '！', cleaned_text)  # 多个感叹号变成一个
    cleaned_text = re.sub(r'[？?]{2,}', '？', cleaned_text)  # 多个问号变成一个

    # 清理标点符号前的空格
    cleaned_text = re.sub(r'\s+([，。！？,.!?])', r'\1', cleaned_text)

    # 清理开头或结尾的标点符号
    cleaned_text = re.sub(r'^[，,]+', '', cleaned_text)  # 开头的逗号
    cleaned_text = re.sub(r'[，,]+$', '', cleaned_text)  # 结尾的逗号

    return cleaned_text.strip()

def split_sentences_smart(text: str) -> tuple[list[str], str]:
    """
    简化的句子分割逻辑，保留所有原始内容用于界面显示
    将紧跟句子结束符的括号内容保持在同一句中，提供更好的界面显示效果
    TTS处理时会单独调用remove_brackets_content移除所有括号
    返回：(完整句子列表, 剩余未完成文本)
    """
    import re

    # 预处理：将句子结束符后紧跟的括号内容附着到句子上
    # 匹配：句子结束符 + 可选空格 + 括号内容
    processed_text = re.sub(r'([。！？.!?；;])\s*(\([^)]*\)|\（[^）]*）|\[[^\]]*\]|【[^】]*】|<[^>]*>)', r'\1\2', text)

    sentences = []
    current_sentence = ""
    i = 0

    while i < len(processed_text):
        char = processed_text[i]
        current_sentence += char

        # 检查是否为句子结束符
        if char in ['。', '！', '？', '.', '!', '?', '；', ';']:
            # 特殊处理省略号：检查是否为连续的点
            if char == '.':
                # 向前看，检查是否为省略号（连续的点）
                dot_count = 1
                j = i + 1
                while j < len(processed_text) and processed_text[j] == '.':
                    current_sentence += processed_text[j]
                    dot_count += 1
                    j += 1

                # 如果是省略号（2个或更多连续的点），不分割句子
                if dot_count >= 2:
                    i = j - 1  # 跳过已处理的点
                else:
                    # 单个点，检查是否紧跟括号内容
                    if i + 1 < len(processed_text) and processed_text[i + 1] in '(（[【<':
                        # 寻找匹配的结束括号
                        bracket_start = processed_text[i + 1]
                        bracket_end = {'(': ')', '（': '）', '[': ']', '【': '】', '<': '>'}[bracket_start]

                        # 读取完整的括号内容
                        k = i + 1
                        while k < len(processed_text):
                            current_sentence += processed_text[k]
                            if processed_text[k] == bracket_end:
                                i = k
                                break
                            k += 1

                    # 分割句子
                    if current_sentence.strip():
                        sentences.append(current_sentence.strip())
                    current_sentence = ""
            else:
                # 其他标点符号，检查是否紧跟括号内容
                if i + 1 < len(processed_text) and processed_text[i + 1] in '(（[【<':
                    # 寻找匹配的结束括号
                    bracket_start = processed_text[i + 1]
                    bracket_end = {'(': ')', '（': '）', '[': ']', '【': '】', '<': '>'}[bracket_start]

                    # 读取完整的括号内容
                    k = i + 1
                    while k < len(processed_text):
                        current_sentence += processed_text[k]
                        if processed_text[k] == bracket_end:
                            i = k
                            break
                        k += 1

                # 分割句子
                if current_sentence.strip():
                    sentences.append(current_sentence.strip())
                current_sentence = ""

        i += 1

    # 剩余文本
    remaining = current_sentence.strip() if current_sentence else ""

    return sentences, remaining



async def process_sentence_tts_with_order(websocket: WebSocket, sentence: str, user_id: str, tts_client, order: int):
    """处理单个句子的TTS生成和发送，包含顺序号"""
    try:
        logger.info(f"开始处理句子TTS #{order}: {sentence[:50]}...")

        # 在TTS处理前移除所有括号内容
        cleaned_sentence = remove_brackets_content(sentence)

        # 如果清理后句子为空，跳过TTS处理
        if not cleaned_sentence.strip():
            logger.info(f"句子TTS #{order} 清理后为空，跳过处理: {sentence}")
            return

        logger.info(f"句子TTS #{order} 清理后内容: {cleaned_sentence}")

        # 为清理后的句子生成TTS音频
        audio_chunks = []
        async for chunk in tts_client.text_to_speech(cleaned_sentence, user_id):
            audio_chunks.append(chunk)

        if audio_chunks:
            # 合并音频数据并发送
            audio_data = b''.join(audio_chunks)
            import base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')

            # 发送流式音频片段，包含顺序号
            await websocket.send_text(json.dumps({
                "type": "tts_audio_chunk",
                "audio_data": audio_base64,
                "format": "mp3",
                "text": sentence,
                "order": order  # 添加顺序号
            }))
            logger.info(f"流式TTS音频片段已发送 #{order}: {len(audio_data)} bytes, 句子: {sentence[:30]}...")
        else:
            logger.warning(f"句子TTS生成失败 #{order}: {sentence}")

    except Exception as e:
        logger.error(f"句子TTS处理错误 #{order}: {e}, 句子: {sentence}")

async def process_sentence_tts(websocket: WebSocket, sentence: str, user_id: str, tts_client):
    """处理单个句子的TTS生成和发送（兼容旧版本）"""
    await process_sentence_tts_with_order(websocket, sentence, user_id, tts_client, 0)

async def handle_voice_change(websocket: WebSocket, user_id: str, new_voice: str):
    """处理音色切换请求"""
    global tts_client
    try:
        logger.info(f"用户 {user_id} 请求切换音色为: {new_voice}")

        # 验证音色是否有效
        valid_voices = [
            'zh_female_shuangkuaisisi_moon_bigtts',
            'zh_female_tianmeixiaoyuan_moon_bigtts',
            'zh_female_xinlingjitang_moon_bigtts',
            'zh_female_jitangmeimei_mars_bigtts',
            'ICL_zh_female_zhixingwenwan_tob',
            'zh_female_tianxinxiaomei_emo_v2_mars_bigtts',
            'zh_female_gaolengyujie_emo_v2_mars_bigtts',
            'zh_female_meilinvyou_emo_v2_mars_bigtts',
            'zh_female_roumeinvyou_emo_v2_mars_bigtts'
        ]

        if new_voice not in valid_voices:
            await websocket.send_text(json.dumps({
                "type": "voice_change_error",
                "error": f"不支持的音色: {new_voice}"
            }))
            return

        # 更新TTS客户端的音色设置
        if tts_client:
            tts_client.voice_type = new_voice
            logger.info(f"TTS客户端音色已更新为: {new_voice}")

            # 发送成功响应
            await websocket.send_text(json.dumps({
                "type": "voice_change_success",
                "voice": new_voice,
                "message": f"音色已切换为: {new_voice}"
            }))
        else:
            await websocket.send_text(json.dumps({
                "type": "voice_change_error",
                "error": "TTS服务不可用"
            }))

    except Exception as e:
        logger.error(f"音色切换处理错误: {e}")
        await websocket.send_text(json.dumps({
            "type": "voice_change_error",
            "error": f"音色切换失败: {str(e)}"
        }))

async def handle_speed_change(websocket: WebSocket, user_id: str, new_speed: float):
    """处理语速调节请求"""
    global tts_client
    try:
        logger.info(f"用户 {user_id} 请求调节语速为: {new_speed}x")

        # 验证语速范围是否有效 (0.5x - 2.0x)
        if not (0.5 <= new_speed <= 2.0):
            await websocket.send_text(json.dumps({
                "type": "speed_change_error",
                "error": f"语速超出范围，请选择 0.5x - 2.0x 之间的值"
            }))
            return

        # 更新TTS客户端的语速设置
        if tts_client:
            tts_client.speed = new_speed
            logger.info(f"TTS客户端语速已更新为: {new_speed}x")

            # 发送成功响应
            await websocket.send_text(json.dumps({
                "type": "speed_change_success",
                "speed": new_speed,
                "message": f"语速已调节为: {new_speed}x"
            }))
        else:
            await websocket.send_text(json.dumps({
                "type": "speed_change_error",
                "error": "TTS服务不可用"
            }))

    except Exception as e:
        logger.error(f"语速调节处理错误: {e}")
        await websocket.send_text(json.dumps({
            "type": "speed_change_error",
            "error": f"语速调节失败: {str(e)}"
        }))

async def handle_manual_stage_change(websocket: WebSocket, user_id: str, new_stage: str):
    """处理手动阶段调节请求"""
    global llm_client
    try:
        logger.info(f"用户 {user_id} 请求手动调节阶段为: {new_stage}")

        # 验证阶段名称是否有效
        valid_stages = ['initial_meeting', 'getting_to_know', 'new_friends', 'close_friends', 'ambiguous', 'love']
        if new_stage not in valid_stages:
            await websocket.send_text(json.dumps({
                "type": "manual_stage_error",
                "error": f"无效的阶段: {new_stage}"
            }))
            return

        # 设置手动阶段
        if llm_client.set_manual_stage(user_id, new_stage):
            logger.info(f"用户 {user_id} 手动阶段已设置为: {new_stage}")

            # 获取更新后的阶段信息
            current_turn_count = await memory_engine.short_term_memory.get_conversation_turn_count(user_id)
            stage_info = llm_client.get_conversation_stage_info(user_id, current_turn_count)

            # 发送成功响应和更新的阶段信息
            await websocket.send_text(json.dumps({
                "type": "manual_stage_success",
                "stage": new_stage,
                "message": f"对话阶段已手动调节为: {stage_info['stage_name']}"
            }))

            # 发送更新的阶段信息
            await websocket.send_text(json.dumps({
                "type": "conversation_stage",
                "stage_info": stage_info
            }))
        else:
            await websocket.send_text(json.dumps({
                "type": "manual_stage_error",
                "error": "阶段设置失败"
            }))

    except Exception as e:
        logger.error(f"手动阶段调节处理错误: {e}")
        await websocket.send_text(json.dumps({
            "type": "manual_stage_error",
            "error": f"阶段调节失败: {str(e)}"
        }))

async def handle_reset_stage_auto(websocket: WebSocket, user_id: str):
    """处理重置为自动阶段模式请求"""
    global llm_client
    try:
        logger.info(f"用户 {user_id} 请求重置为自动阶段模式")

        # 清除手动阶段设置
        llm_client.clear_manual_stage(user_id)
        logger.info(f"用户 {user_id} 已重置为自动阶段模式")

        # 获取更新后的阶段信息
        current_turn_count = await memory_engine.short_term_memory.get_conversation_turn_count(user_id)
        stage_info = llm_client.get_conversation_stage_info(user_id, current_turn_count)

        # 发送成功响应和更新的阶段信息
        await websocket.send_text(json.dumps({
            "type": "manual_stage_success",
            "stage": "auto",
            "message": "已重置为自动阶段模式"
        }))

        # 发送更新的阶段信息
        await websocket.send_text(json.dumps({
            "type": "conversation_stage",
            "stage_info": stage_info
        }))

    except Exception as e:
        logger.error(f"重置自动阶段处理错误: {e}")
        await websocket.send_text(json.dumps({
            "type": "manual_stage_error",
            "error": f"重置失败: {str(e)}"
        }))

async def handle_chat_message(websocket: WebSocket, user_id: str, user_message: str, image_url: str = None, search_query: str = None):
    global llm_client, search_service, memory_engine
    try:
        # 用户发送消息时取消沉默检测并重置主动对话计数
        cancel_silence_detection(user_id)
        reset_proactive_count(user_id)
        reset_follow_up_count(user_id)  # 重置追问计数

        # 取消用户的所有TTS任务（实现打断机制）
        cancelled_tts_count = cancel_user_tts_tasks(user_id)
        if cancelled_tts_count > 0:
            logger.info(f"用户 {user_id} 发送新消息，已打断 {cancelled_tts_count} 个TTS任务")
        # 先获取用户记忆上下文（搜索和对话都需要）
        memory_context = await memory_engine.get_user_context(user_id, user_message)

        search_results = None

        # 如果有搜索查询，先进行搜索
        if search_query and search_service:
            logger.info(f"执行智能体搜索: {search_query}")
            await websocket.send_text(json.dumps({"type": "search_start", "query": search_query}))

            try:
                # 将用户记忆上下文传递给搜索服务
                results = await search_service.search_web(search_query, max_results=3, user_context=memory_context)
                search_results = search_service.format_search_results(results, search_query)
                await websocket.send_text(json.dumps({"type": "search_complete", "results": search_results}))
            except Exception as e:
                logger.error(f"搜索失败: {e}")
                await websocket.send_text(json.dumps({"type": "search_error", "error": str(e)}))

        # 构建增强的prompt
        enhanced_context = ""
        if memory_context.get("context_summary"):
            enhanced_context = f"\n\n【用户背景】\n{memory_context['context_summary']}"

        # 获取当前对话轮数（这将是即将开始的新一轮对话）
        current_turn_count = await memory_engine.short_term_memory.get_conversation_turn_count(user_id) + 1

        # 分析用户消息，提取关键信息
        llm_client.analyze_user_message(user_id, user_message)

        # 检查是否需要触发AI分析聊天记录
        if llm_client.stage_manager.should_trigger_ai_analysis(user_id, current_turn_count):
            logger.info(f"触发AI分析聊天记录 - 用户: {user_id}, 轮数: {current_turn_count}")
            await perform_ai_analysis(user_id, current_turn_count, memory_context.get("short_context", []))

        # 获取对话阶段信息
        stage_info = llm_client.get_conversation_stage_info(user_id, current_turn_count)
        logger.info(f"用户 {user_id} 对话轮数: {current_turn_count}, 阶段: {stage_info['stage_name']}, 信息完成度: {stage_info['info_completion']:.1f}%")

        # 添加短期对话上下文到LLM（明确标识消息来源）
        short_context = memory_context.get("short_context", [])
        context_messages = []

        # 只取最近几轮对话作为上下文
        recent_context = short_context[-6:] if len(short_context) > 6 else short_context
        for msg in recent_context:
            # 明确标识消息来源，帮助AI理解上下文
            if msg["role"] == "user":
                context_messages.append({
                    "role": "user",
                    "content": msg["content"]  # 用户消息保持原样
                })
            elif msg["role"] == "assistant":
                if msg.get("is_proactive", False):
                    # 主动消息添加标识
                    context_messages.append({
                        "role": "assistant",
                        "content": f"[主动对话] {msg['content']}"
                    })
                else:
                    # 普通回复消息保持原样
                    context_messages.append({
                        "role": "assistant",
                        "content": msg["content"]
                    })
            else:
                # 保持原有格式作为备选
                context_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        # 发送阶段信息到前端
        await websocket.send_text(json.dumps({
            "type": "conversation_stage",
            "stage_info": stage_info
        }))

        # 发送用户档案活动信息到前端
        try:
            profile_activity = llm_client.stage_manager.get_user_profile_activity(user_id)
            logger.info(f"📊 获取到用户档案活动信息: {profile_activity}")

            await websocket.send_text(json.dumps({
                "type": "profile_activity",
                "activity_info": profile_activity
            }))
            logger.info(f"✅ 已发送用户档案活动消息给用户 {user_id}")

        except Exception as e:
            logger.error(f"❌ 发送用户档案活动消息失败: {e}")
            import traceback
            traceback.print_exc()

        # 开始生成回复
        await websocket.send_text(json.dumps({"type": "generation_start", "content": ""}))

        assistant_response = ""
        sentence_buffer = ""  # 用于累积句子
        sentence_order = 0  # 句子顺序号

        async for chunk in llm_client.stream_generate(
                user_message,
                image_url,
                search_results,
                context_messages=context_messages,
                enhanced_context=enhanced_context,
                conversation_turn_count=current_turn_count,
                user_id=user_id
        ):
            assistant_response += chunk
            sentence_buffer += chunk

            # 发送文本块到前端
            await websocket.send_text(json.dumps({"type": "generation_chunk", "content": chunk}))

            # 检查是否有完整的句子（按标点符号分割）
            if tts_client and any(punct in sentence_buffer for punct in ['。', '！', '？', '.', '!', '?', '；', ';', '，', ',']):
                # 使用智能分割函数处理句子
                sentences, remaining_text = split_sentences_smart(sentence_buffer)

                # 处理每个完整句子，并分配顺序号
                for sentence in sentences:
                    if sentence.strip():
                        try:
                            sentence_order += 1
                            logger.info(f"流式TTS处理句子 #{sentence_order}: {sentence}")
                            # 为每个句子生成TTS音频，传递顺序号
                            tts_task = asyncio.create_task(process_sentence_tts_with_order(websocket, sentence, user_id, tts_client, sentence_order))
                            add_user_tts_task(user_id, tts_task)
                        except Exception as e:
                            logger.error(f"流式TTS处理错误: {e}")

                # 保留未完成的句子
                sentence_buffer = remaining_text

        await websocket.send_text(json.dumps({"type": "generation_end", "content": ""}))

        # 处理最后剩余的文本
        if tts_client and sentence_buffer.strip():
            try:
                # 移除括号内容
                cleaned_final_sentence = remove_brackets_content(sentence_buffer.strip())
                if cleaned_final_sentence:  # 确保清理后的句子不为空
                    sentence_order += 1
                    logger.info(f"处理最后剩余文本 #{sentence_order}: {cleaned_final_sentence}")
                    final_tts_task = asyncio.create_task(process_sentence_tts_with_order(websocket, cleaned_final_sentence, user_id, tts_client, sentence_order))
                    add_user_tts_task(user_id, final_tts_task)
            except Exception as e:
                logger.error(f"最后文本TTS处理错误: {e}")

        # 发送TTS完成信号
        await websocket.send_text(json.dumps({"type": "tts_complete", "content": ""}))

        # 清理已完成的TTS任务
        cleanup_completed_tts_tasks(user_id)

        # 保存对话到记忆系统
        await memory_engine.save_conversation(user_id, user_message, assistant_response)

        # 不再在这里启动沉默检测，等待前端通知音频播放完成后再启动
        # await start_silence_detection_after_ai_response(user_id, websocket)

        # 检查是否需要进行记忆转换
        conversion_results = await memory_engine.check_and_convert_memory(user_id)
        if conversion_results and conversion_results["analysis_requests"]:
            logger.info(f"用户 {user_id} 触发记忆转换，生成 {len(conversion_results['analysis_requests'])} 个分析请求")
            # 异步处理记忆转换，不阻塞当前对话
            asyncio.create_task(process_memory_conversion(user_id, conversion_results))

    except Exception as e:
        logger.error(f"处理聊天消息错误: {e}")
        await websocket.send_text(json.dumps({"type": "error", "content": "生成回复时发生错误"}))


async def perform_ai_analysis(user_id: str, current_turn: int, chat_history: list):
    """执行AI分析聊天记录"""
    global llm_client

    try:
        # 构建聊天记录文本
        chat_text = ""
        for msg in chat_history:
            role = "用户" if msg["role"] == "user" else "悠悠"
            chat_text += f"{role}：{msg['content']}\n"

        if not chat_text.strip():
            logger.warning(f"用户 {user_id} 聊天记录为空，跳过AI分析")
            return

        # 获取分析prompt
        analysis_prompt = llm_client.stage_manager.get_analysis_prompt(user_id)

        # 构建完整的分析请求
        analysis_request = f"""【聊天记录】
{chat_text}

{analysis_prompt}"""

        logger.info(f"开始AI分析用户 {user_id} 的聊天记录")

        # 调用LLM进行分析
        analysis_response = ""
        async for chunk in llm_client.stream_generate(
                analysis_request,
                None,  # 不需要图片
                None,  # 不需要搜索结果
                context_messages=[],  # 不需要上下文
                enhanced_context="",  # 不需要增强上下文
                conversation_turn_count=current_turn,
                user_id=user_id,
                system_prompt="你是一个专业的对话分析助手，请严格按照要求分析聊天记录并输出JSON格式结果。"
        ):
            analysis_response += chunk

        logger.info(f"AI分析响应: {analysis_response}")

        # 解析AI分析结果
        try:
            import json
            # 尝试提取JSON部分
            json_start = analysis_response.find('{')
            json_end = analysis_response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = analysis_response[json_start:json_end]
                analysis_result = json.loads(json_str)

                # 应用分析结果
                llm_client.stage_manager.apply_ai_analysis_result(user_id, analysis_result)

                # 更新分析轮数
                llm_client.stage_manager.update_analysis_turn(user_id, current_turn)

                logger.info(f"AI分析完成 - 用户: {user_id}, 结果: {analysis_result}")
            else:
                logger.error(f"AI分析响应格式错误，未找到JSON: {analysis_response}")

        except json.JSONDecodeError as e:
            logger.error(f"AI分析结果JSON解析失败: {e}, 响应: {analysis_response}")
        except Exception as e:
            logger.error(f"处理AI分析结果时出错: {e}")

    except Exception as e:
        logger.error(f"执行AI分析时出错: {e}")


async def process_memory_conversion(user_id: str, conversion_results: dict):
    """处理记忆转换请求"""
    global llm_client, memory_engine

    try:
        logger.info(f"开始处理用户 {user_id} 的记忆转换")

        for analysis_request in conversion_results["analysis_requests"]:
            category = analysis_request["category"]
            prompt = analysis_request["prompt"]

            try:
                logger.info(f"分析用户 {user_id} 的 {category} 信息")

                # 调用LLM进行分析
                analysis_response = ""
                # 构建专门的分析上下文
                analysis_context = "\n\n【分析任务】\n你是一个专业的用户档案分析助手，请严格按照要求分析对话记录并输出JSON格式结果。"

                async for chunk in llm_client.stream_generate(
                        prompt,
                        None,  # 不需要图片
                        None,  # 不需要搜索结果
                        context_messages=[],  # 不需要上下文
                        enhanced_context=analysis_context,  # 使用分析上下文
                        conversation_turn_count=1,
                        user_id=user_id
                ):
                    analysis_response += chunk

                # 应用分析结果
                success = await memory_engine.apply_profile_analysis(user_id, category, analysis_response)

                if success:
                    conversion_results["successful_updates"].append(category)
                    logger.info(f"成功转换用户 {user_id} 的 {category} 记忆")
                else:
                    conversion_results["failed_updates"].append(category)
                    logger.warning(f"转换用户 {user_id} 的 {category} 记忆失败")

                # 避免过于频繁的API调用
                await asyncio.sleep(1)

            except Exception as e:
                logger.error(f"处理 {category} 分析时出错: {e}")
                conversion_results["failed_updates"].append(category)

        # 记录转换结果
        successful_count = len(conversion_results["successful_updates"])
        total_count = len(conversion_results["analysis_requests"])

        logger.info(f"用户 {user_id} 记忆转换完成: {successful_count}/{total_count} 成功")

        # 获取更新后的档案摘要
        profile_summary = memory_engine.get_user_profile_summary(user_id)
        logger.info(f"用户 {user_id} 档案完成度: {profile_summary.get('completion_rate', 0):.2%}")

        # 通知所有连接的WebSocket客户端档案更新
        if websocket_manager and successful_count > 0:
            # 获取更新后的档案活动信息
            profile_activity = llm_client.stage_manager.get_user_profile_activity(user_id)

            # 构建通知消息
            update_message = {
                "type": "profile_updated",
                "user_id": user_id,
                "activity_info": profile_activity,
                "conversion_summary": {
                    "successful_updates": conversion_results["successful_updates"],
                    "total_categories": total_count,
                    "successful_count": successful_count
                }
            }

            # 发送给该用户的所有连接
            await websocket_manager.broadcast_to_user(user_id, json.dumps(update_message))

    except Exception as e:
        logger.error(f"处理记忆转换时出错: {e}")


async def trigger_init_proactive_chat(websocket: WebSocket, user_id: str):
    """触发初始化主动对话"""
    await asyncio.sleep(2)  # 延迟2秒，让前端准备好
    try:
        # 重置主动对话计数器（新会话开始）
        user_proactive_count[user_id] = 0

        # 检查用户是否是新用户或者很久没有对话
        current_turn_count = await memory_engine.short_term_memory.get_conversation_turn_count(user_id)

        # 如果是新用户（对话轮数为0）或者很久没有对话，触发欢迎主动对话
        if current_turn_count == 0:
            logger.info(f"触发初始化主动对话: {user_id} (新用户)")
            await handle_proactive_chat(websocket, user_id, 1, trigger_type="init")
        else:
            logger.info(f"触发重连主动对话: {user_id} (轮数: {current_turn_count})")
            await handle_proactive_chat(websocket, user_id, 1, trigger_type="reconnect")
    except Exception as e:
        logger.error(f"触发初始化主动对话失败: {e}")

# 用户沉默检测状态管理
user_silence_timers = {}  # 存储每个用户的沉默检测计时器
user_last_ai_message_time = {}  # 存储每个用户最后一次AI消息的时间
user_silence_timeout = {}  # 存储每个用户的沉默超时设置
DEFAULT_SILENCE_TIMEOUT = 30  # 默认30秒沉默时间触发主动对话

# 递增间隔主动对话管理
user_proactive_count = {}  # 存储每个用户连续主动对话的次数
user_last_user_response = {}  # 存储每个用户最后一次回应的时间
user_last_proactive_time = {}  # 存储每个用户最后一次主动对话的时间
user_follow_up_count = {}  # 存储每个用户连续追问的次数
user_last_proactive_message = {}  # 存储每个用户最后一次主动对话的内容，用于判断是否需要追问
PROGRESSIVE_INTERVALS = [30, 60, 120, 300, 600, 1200, 2400]  # 递增间隔序列：30秒, 1分钟, 2分钟, 5分钟, 10分钟, 20分钟, 40分钟

# TTS任务管理
user_tts_tasks = {}  # 存储每个用户的TTS任务，用于中断

def cancel_user_tts_tasks(user_id: str):
    """取消用户的所有TTS任务"""
    if user_id in user_tts_tasks:
        tasks = user_tts_tasks[user_id]
        cancelled_count = 0

        for task in tasks:
            if not task.done():
                task.cancel()
                cancelled_count += 1

        user_tts_tasks[user_id] = []
        logger.info(f"已取消用户 {user_id} 的 {cancelled_count} 个TTS任务")
        return cancelled_count
    return 0

def add_user_tts_task(user_id: str, task):
    """添加用户的TTS任务"""
    if user_id not in user_tts_tasks:
        user_tts_tasks[user_id] = []
    user_tts_tasks[user_id].append(task)

def cleanup_completed_tts_tasks(user_id: str):
    """清理已完成的TTS任务"""
    if user_id in user_tts_tasks:
        user_tts_tasks[user_id] = [task for task in user_tts_tasks[user_id] if not task.done()]

async def handle_audio_playback_complete(user_id: str, websocket: WebSocket):
    """处理音频播放完成，开始相应的沉默检测"""
    try:
        # 检查是否是主动对话的音频播放完成
        current_time = time.time()
        last_proactive_time = user_last_proactive_time.get(user_id, 0)

        # 如果最近5秒内有主动对话，认为是主动对话的音频播放完成
        if current_time - last_proactive_time < 5:
            logger.info(f"主动对话音频播放完成，开始递增间隔沉默检测: {user_id}")
            await start_silence_detection_after_proactive(user_id, websocket)
        else:
            logger.info(f"普通对话音频播放完成，开始固定间隔沉默检测: {user_id}")
            await start_silence_detection_after_ai_response(user_id, websocket)

    except Exception as e:
        logger.error(f"处理音频播放完成失败: {e}")

async def start_silence_detection_after_ai_response(user_id: str, websocket: WebSocket):
    """AI回复后开始沉默检测，使用5秒间隔"""
    # 取消之前的计时器
    if user_id in user_silence_timers:
        user_silence_timers[user_id].cancel()

    # 记录AI消息时间
    user_last_ai_message_time[user_id] = time.time()

    # 使用固定的30秒间隔（AI回复后的第一次主动对话）
    timeout = 30

    logger.info(f"AI回复后开始沉默检测，用户 {user_id}，等待 {timeout} 秒")

    # 创建新的沉默检测任务
    async def silence_check():
        try:
            await asyncio.sleep(timeout)
            # 检查用户是否还在线且WebSocket连接正常
            if websocket.client_state.name == 'CONNECTED':
                logger.info(f"用户 {user_id} 在AI回复后沉默 {timeout} 秒，触发第1次主动对话")
                # AI回复后的沉默检测，重置追问计数，因为这是新的对话轮次
                user_follow_up_count[user_id] = 0
                await handle_proactive_chat(websocket, user_id, 1, trigger_type="silence")
        except asyncio.CancelledError:
            logger.debug(f"用户 {user_id} 沉默检测被取消")
        except Exception as e:
            logger.error(f"沉默检测错误: {e}")
        finally:
            # 清理计时器记录
            if user_id in user_silence_timers:
                del user_silence_timers[user_id]

    # 启动沉默检测任务
    user_silence_timers[user_id] = asyncio.create_task(silence_check())

async def start_silence_detection_after_proactive(user_id: str, websocket: WebSocket):
    """主动对话后开始沉默检测，使用递增间隔"""
    # 取消之前的计时器
    if user_id in user_silence_timers:
        user_silence_timers[user_id].cancel()

    # 记录主动对话时间
    user_last_proactive_time[user_id] = time.time()

    # 获取递增间隔时间
    timeout = get_progressive_interval(user_id)

    logger.info(f"🔍 主动对话后开始沉默检测，用户 {user_id}，等待 {timeout} 秒 (当前主动对话计数: {user_proactive_count.get(user_id, 0)})")

    # 创建新的沉默检测任务
    async def silence_check():
        try:
            await asyncio.sleep(timeout)
            # 检查用户是否还在线且WebSocket连接正常
            if websocket.client_state.name == 'CONNECTED':
                # 检查是否有未回应的主动对话，如果有，则先进行追问
                current_follow_up_count = user_follow_up_count.get(user_id, 0)

                if current_follow_up_count == 0:
                    # 第一次追问
                    follow_up_count = increment_follow_up_count(user_id)
                    logger.info(f"用户 {user_id} 对主动对话没有回应，触发第 {follow_up_count} 次追问")
                    await handle_proactive_chat(websocket, user_id, 1, is_follow_up=True, follow_up_count=follow_up_count, trigger_type="silence")
                elif current_follow_up_count < 3:
                    # 继续追问（最多3次）
                    follow_up_count = increment_follow_up_count(user_id)
                    logger.info(f"用户 {user_id} 对追问没有回应，触发第 {follow_up_count} 次追问")
                    await handle_proactive_chat(websocket, user_id, 1, is_follow_up=True, follow_up_count=follow_up_count, trigger_type="silence")
                else:
                    # 追问次数已达上限，开始新的主动对话
                    proactive_count = user_proactive_count.get(user_id, 0) + 1
                    logger.info(f"用户 {user_id} 追问次数已达上限，触发第 {proactive_count} 次主动对话")
                    # 重置追问计数，开始新的主动对话
                    user_follow_up_count[user_id] = 0
                    await handle_proactive_chat(websocket, user_id, proactive_count, trigger_type="silence")
        except asyncio.CancelledError:
            logger.debug(f"用户 {user_id} 沉默检测被取消")
        except Exception as e:
            logger.error(f"沉默检测错误: {e}")
        finally:
            # 清理计时器记录
            if user_id in user_silence_timers:
                del user_silence_timers[user_id]

    # 启动沉默检测任务
    user_silence_timers[user_id] = asyncio.create_task(silence_check())

def cancel_silence_detection(user_id: str):
    """取消沉默检测（用户有活动时调用）"""
    if user_id in user_silence_timers:
        user_silence_timers[user_id].cancel()
        del user_silence_timers[user_id]
        logger.debug(f"取消用户 {user_id} 的沉默检测")

def get_progressive_interval(user_id: str) -> int:
    """获取当前用户应该使用的递增间隔时间（秒）"""
    # 获取用户连续主动对话次数
    proactive_count = user_proactive_count.get(user_id, 0)

    # 使用递增间隔序列，索引从0开始
    if proactive_count < len(PROGRESSIVE_INTERVALS):
        interval = PROGRESSIVE_INTERVALS[proactive_count]
    else:
        # 超出序列长度时，使用最后一个间隔
        interval = PROGRESSIVE_INTERVALS[-1]

    logger.info(f"🔍 用户 {user_id} 递增间隔计算: 当前计数={proactive_count}, 使用间隔={interval}秒 (序列索引{proactive_count})")
    return interval

def reset_proactive_count(user_id: str):
    """重置用户的主动对话计数（用户回应后调用）"""
    if user_id in user_proactive_count:
        old_count = user_proactive_count[user_id]
        user_proactive_count[user_id] = 0
        user_last_user_response[user_id] = time.time()
        logger.info(f"用户 {user_id} 回应了，重置主动对话计数 ({old_count} -> 0)")

def increment_proactive_count(user_id: str):
    """增加用户的主动对话计数"""
    user_proactive_count[user_id] = user_proactive_count.get(user_id, 0) + 1
    current_count = user_proactive_count[user_id]
    logger.info(f"用户 {user_id} 主动对话计数增加到: {current_count}")

def reset_follow_up_count(user_id: str):
    """重置用户追问计数（用户有回应时调用）"""
    if user_id in user_follow_up_count:
        old_count = user_follow_up_count[user_id]
        user_follow_up_count[user_id] = 0
        logger.info(f"用户 {user_id} 回应了，重置追问计数 ({old_count} -> 0)")

def increment_follow_up_count(user_id: str):
    """增加用户追问计数"""
    user_follow_up_count[user_id] = user_follow_up_count.get(user_id, 0) + 1
    current_count = user_follow_up_count[user_id]
    logger.info(f"用户 {user_id} 追问计数增加到: {current_count}")
    return current_count

async def handle_proactive_chat(websocket: WebSocket, user_id: str, count: int,
                                is_follow_up: bool = False, follow_up_count: int = 0,
                                trigger_type: str = "timer"):
    """
    处理主动对话消息

    Args:
        trigger_type: 触发类型 - "timer"(定时器), "init"(初始化), "silence"(沉默检测), "reconnect"(重连)
    """
    global llm_client, memory_engine

    try:
        chat_type = "追问" if is_follow_up else "主动对话"
        trigger_desc = {
            "timer": "定时触发",
            "init": "初始化触发",
            "silence": "沉默检测触发",
            "reconnect": "重连触发"
        }.get(trigger_type, "未知触发")

        logger.info(f"处理{chat_type}: {user_id} - 第{count}次 ({trigger_desc})")

        # 获取用户记忆上下文
        memory_context = await memory_engine.get_user_context(user_id, "")

        # 获取当前对话轮数和阶段信息
        current_turn_count = await memory_engine.short_term_memory.get_conversation_turn_count(user_id) + 1
        stage_info = llm_client.get_conversation_stage_info(user_id, current_turn_count)
        logger.info(f"主动对话 - 用户 {user_id} 对话轮数: {current_turn_count}, 阶段: {stage_info['stage_name']}, 信息完成度: {stage_info['info_completion']:.1f}%")

        # 发送阶段信息到前端
        await websocket.send_text(json.dumps({
            "type": "conversation_stage",
            "stage_info": stage_info
        }))

        # 分析最近的对话内容，避免重复话题（明确区分消息来源）
        recent_user_messages = []
        recent_ai_messages = []
        recent_proactive_messages = []

        for msg in memory_context.get("short_context", [])[-10:]:  # 最近10条消息
            if msg["role"] == "user":
                recent_user_messages.append({
                    "content": msg["content"],
                    "timestamp": msg.get("timestamp", ""),
                    "type": "user"
                })
            elif msg["role"] == "assistant":
                if msg.get("is_proactive", False):
                    # AI主动消息
                    recent_proactive_messages.append({
                        "content": msg["content"],
                        "timestamp": msg.get("timestamp", ""),
                        "type": "proactive"
                    })
                else:
                    # AI回复消息
                    recent_ai_messages.append({
                        "content": msg["content"],
                        "timestamp": msg.get("timestamp", ""),
                        "type": "response"
                    })

        # 检测用户最近讨论的主题（只基于真实用户消息）
        user_recent_topics = []
        for msg_data in recent_user_messages:
            content_lower = msg_data["content"].lower()
            if any(keyword in content_lower for keyword in ["动漫", "电影", "看", "追"]):
                user_recent_topics.append("entertainment")
            if any(keyword in content_lower for keyword in ["设计", "画", "艺术", "创作"]):
                user_recent_topics.append("creative")
            if any(keyword in content_lower for keyword in ["学习", "工作", "项目"]):
                user_recent_topics.append("learning")

        # 使用基于关系阶段的主动对话prompt
        proactive_system_prompt = llm_client.stage_manager.get_proactive_prompt(
            user_id, current_turn_count, is_follow_up, follow_up_count
        )

        # 构建详细的上下文信息用于增强prompt
        user_messages_summary = []
        if recent_user_messages:
            for msg_data in recent_user_messages[-3:]:  # 最近3条用户消息
                user_messages_summary.append(f"用户说：{msg_data['content']}")

        ai_responses_summary = []
        if recent_ai_messages:
            for msg_data in recent_ai_messages[-3:]:  # 最近3条AI回复
                ai_responses_summary.append(f"我回复：{msg_data['content']}")

        proactive_messages_summary = []
        if recent_proactive_messages:
            for msg_data in recent_proactive_messages[-2:]:  # 最近2条主动消息
                proactive_messages_summary.append(f"我主动说：{msg_data['content']}")

        # 添加上下文信息到阶段prompt
        context_info = f"""
        
        【重要：上下文区分】
        以下是最近的对话历史，请明确区分消息来源：
        
        用户最近说过的话：
        {chr(10).join(user_messages_summary) if user_messages_summary else '用户还没有发言或刚开始对话'}

        我最近的回复：
        {chr(10).join(ai_responses_summary) if ai_responses_summary else '还没有回复过用户'}

        我最近主动说过的话：
        {chr(10).join(proactive_messages_summary) if proactive_messages_summary else '还没有主动发起过对话'}
        
        用户特征：{memory_context.get('context_summary', '新认识的朋友')}
        用户感兴趣的话题：{', '.join(user_recent_topics) if user_recent_topics else '还在互相了解阶段'}
        
        要求：
        1. 完全自主决定聊什么，不要回应任何预设内容
        2. 可以分享你的日常生活，或者询问对方近况  
        3. 1-2句话足够，不要长篇大论
        4. 避免重复之前的话题
        5. 要符合你18岁大一学生的身份和兴趣
        6. 像真正的朋友发微信一样自然
        
        🚫 **记忆使用严格约束**：
        - 绝对禁止虚构用户未曾提及的信息
        - 不能说"我记得你说过..."、"你之前提到..."等，除非在上述记录中确实存在
        - 如果不确定用户的偏好或经历，宁可重新询问，也不要推测
        
        🎭 **表情动作要求**：
        - 在回复的最后添加悠悠的表情和动作，格式：(表情 动作)
        - 可用表情：傲娇、委屈、害羞、惊喜、惊讶、温柔的笑、生气、眯眯眼、眼泪、脸红、落泪、鬼脸
        - 可用动作：挥手、点头、摇头、睡觉、叉腰、托腮、抱胸
        - 最多一个表情+一个动作，可以没有任何表情和动作，也可以只有一个表情或一个动作
        - 示例：(温柔的笑)、(点头)、(害羞 托腮)
        
        ⚠️ 重要：除了表情动作括号外，回复中不能有任何其他括号内容！
        """

        proactive_system_prompt += context_info

        # 添加短期对话上下文（明确标识消息来源）
        short_context = memory_context.get("short_context", [])
        context_messages = []

        # 只取最近几轮对话作为上下文
        recent_context = short_context[-4:] if len(short_context) > 4 else short_context
        for msg in recent_context:
            # 为主动对话添加更明确的上下文标识
            if msg["role"] == "user":
                context_messages.append({
                    "role": "user",
                    "content": f"[用户消息] {msg['content']}"
                })
            elif msg["role"] == "assistant":
                if msg.get("is_proactive", False):
                    # 主动消息使用特殊标识
                    context_messages.append({
                        "role": "assistant",
                        "content": f"[我之前主动说] {msg['content']}"
                    })
                else:
                    # 普通回复消息
                    context_messages.append({
                        "role": "assistant",
                        "content": f"[我之前回复] {msg['content']}"
                    })
            else:
                # 保持原有格式作为备选
                context_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        # 开始生成主动对话回复
        await websocket.send_text(json.dumps({"type": "generation_start", "content": ""}))

        assistant_response = ""
        sentence_buffer = ""  # 用于累积句子
        sentence_order = 0  # 句子顺序号

        logger.info(f"开始主动对话TTS处理，TTS客户端状态: {tts_client is not None}")

        # 主动对话时传递一个空的用户消息，让AI根据系统提示自主生成内容
        empty_user_message = ""

        # 构建完整的增强上下文，包含基础角色设定和主动对话指令
        full_enhanced_context = f"""
【用户背景】
{memory_context.get('context_summary', '新用户')}

【主动对话场景】
{proactive_system_prompt}
        """

        async for chunk in llm_client.stream_generate(
                empty_user_message,  # 传递空消息，让AI根据系统提示主动说话
                None,  # 主动对话不需要图片
                None,  # 主动对话不需要搜索结果
                context_messages=context_messages,
                enhanced_context=full_enhanced_context,
                conversation_turn_count=current_turn_count,  # 使用正确的对话轮数
                user_id=user_id  # 确保使用正确的用户ID
        ):
            assistant_response += chunk
            sentence_buffer += chunk

            # 发送文本块到前端
            await websocket.send_text(json.dumps({"type": "generation_chunk", "content": chunk}))

            # 检查是否有完整的句子（按标点符号分割）
            if tts_client and any(punct in sentence_buffer for punct in ['。', '！', '？', '.', '!', '?', '；', ';', '，', ',']):
                logger.debug(f"主动对话检测到标点符号，当前句子缓冲区: '{sentence_buffer}'")
                # 使用智能分割函数处理句子
                sentences, remaining_text = split_sentences_smart(sentence_buffer)
                logger.debug(f"主动对话句子分割结果: {len(sentences)} 个句子, 剩余文本: '{remaining_text}'")

                # 处理每个完整句子，并分配顺序号
                for sentence in sentences:
                    if sentence.strip():
                        try:
                            sentence_order += 1
                            logger.info(f"主动对话流式TTS处理句子 #{sentence_order}: '{sentence}'")
                            # 为每个句子生成TTS音频，传递顺序号
                            proactive_tts_task = asyncio.create_task(process_sentence_tts_with_order(websocket, sentence, user_id, tts_client, sentence_order))
                            add_user_tts_task(user_id, proactive_tts_task)
                        except Exception as e:
                            logger.error(f"主动对话流式TTS处理错误: {e}")
                    else:
                        logger.warning(f"主动对话句子为空，跳过TTS处理: '{sentence}'")

                # 保留未完成的句子
                sentence_buffer = remaining_text

        await websocket.send_text(json.dumps({"type": "generation_end", "content": ""}))

        # 处理最后剩余的文本（主动对话）
        if tts_client and sentence_buffer.strip():
            try:
                logger.debug(f"主动对话处理最后剩余文本，原始内容: '{sentence_buffer.strip()}'")
                # 移除括号内容
                cleaned_final_sentence = remove_brackets_content(sentence_buffer.strip())
                logger.debug(f"主动对话清理后的最后句子: '{cleaned_final_sentence}'")
                if cleaned_final_sentence:  # 确保清理后的句子不为空
                    sentence_order += 1
                    logger.info(f"主动对话处理最后剩余文本 #{sentence_order}: '{cleaned_final_sentence}'")
                    proactive_final_tts_task = asyncio.create_task(process_sentence_tts_with_order(websocket, cleaned_final_sentence, user_id, tts_client, sentence_order))
                    add_user_tts_task(user_id, proactive_final_tts_task)
                else:
                    logger.warning(f"主动对话最后句子清理后为空，跳过TTS处理。原始: '{sentence_buffer.strip()}'")
            except Exception as e:
                logger.error(f"主动对话最后文本TTS处理错误: {e}")

        # 发送TTS完成信号
        await websocket.send_text(json.dumps({"type": "tts_complete", "content": ""}))

        # 清理已完成的TTS任务
        cleanup_completed_tts_tasks(user_id)

        # 保存主动对话到记忆系统 - 只保存AI的回复，不保存虚假的用户消息
        # 主动对话是AI主动发起的，不需要保存用户消息部分
        message_type = "follow_up" if is_follow_up else "proactive"
        await memory_engine.save_ai_message(user_id, assistant_response, message_type)

        # 增加主动对话计数（仅对沉默触发的主动对话）
        if trigger_type == "silence":
            increment_proactive_count(user_id)

        # 不再在这里启动沉默检测，等待前端通知音频播放完成后再启动
        # 注意：初始化主动对话（init/reconnect）后也要启动沉默检测
        # await start_silence_detection_after_proactive(user_id, websocket)

    except Exception as e:
        # WebSocket连接关闭是正常情况，不需要记录为错误
        if "1001" in str(e) and "going away" in str(e):
            logger.info(f"主动对话处理中WebSocket正常关闭: {e}")
        else:
            logger.error(f"处理主动对话错误: {e}")
            try:
                await websocket.send_text(json.dumps({"type": "error", "content": "主动对话生成失败"}))
            except:
                # WebSocket已断开，无法发送错误消息
                pass

# ==================== Memory Engine API ====================

@app.get("/proactive/silence-timeout/{user_id}")
async def get_silence_timeout(user_id: str):
    """获取用户的沉默超时设置"""
    timeout = user_silence_timeout.get(user_id, DEFAULT_SILENCE_TIMEOUT)
    return {"user_id": user_id, "silence_timeout": timeout, "default_timeout": DEFAULT_SILENCE_TIMEOUT}

@app.post("/proactive/silence-timeout/{user_id}")
async def set_silence_timeout(user_id: str, request: dict):
    """设置用户的沉默超时时间（秒）"""
    timeout = request.get("timeout")
    if not timeout or timeout < 5 or timeout > 300:  # 限制在5秒到5分钟之间
        return JSONResponse(status_code=400, content={"error": "沉默超时时间必须在5-300秒之间"})

    user_silence_timeout[user_id] = timeout
    logger.info(f"用户 {user_id} 沉默超时设置为 {timeout} 秒")
    return {"user_id": user_id, "silence_timeout": timeout, "message": "沉默超时设置成功"}

@app.get("/memory/stats")
async def get_memory_stats():
    """获取记忆系统统计信息"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    try:
        user_profile_stats = await memory_engine.user_profile_store.get_user_stats()
        short_term_stats = await memory_engine.short_term_memory.get_memory_stats()
        long_term_stats = await memory_engine.long_term_memory.get_memory_stats()
        embedding_stats = memory_engine.embedding_engine.get_embedding_stats()

        return {
            "success": True,
            "stats": {
                "user_profiles": user_profile_stats,
                "short_term_memory": short_term_stats,
                "long_term_memory": long_term_stats,
                "embedding_engine": embedding_stats
            }
        }
    except Exception as e:
        logger.error(f"获取记忆统计失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"获取统计失败: {str(e)}"})

@app.get("/memory/user/{user_id}/profile")
async def get_user_profile(user_id: str):
    """获取用户档案"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    try:
        profile = await memory_engine.user_profile_store.get_profile(user_id)
        if profile:
            return {"success": True, "profile": profile}
        else:
            return JSONResponse(status_code=404, content={"error": "用户不存在"})
    except Exception as e:
        logger.error(f"获取用户档案失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"获取失败: {str(e)}"})

@app.post("/memory/user/{user_id}/profile")
async def update_user_profile(user_id: str, profile_data: dict):
    """更新用户档案"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    try:
        success = await memory_engine.user_profile_store.update_profile(user_id, profile_data)
        if success:
            return {"success": True, "message": "档案更新成功"}
        else:
            return JSONResponse(status_code=404, content={"error": "用户不存在"})
    except Exception as e:
        logger.error(f"更新用户档案失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"更新失败: {str(e)}"})

@app.put("/memory/user/{user_id}/profile")
async def create_user_profile(user_id: str, profile_data: dict):
    """创建用户档案"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    try:
        # 检查用户是否已存在
        existing_profile = await memory_engine.user_profile_store.get_profile(user_id)
        if existing_profile:
            return JSONResponse(status_code=409, content={"error": "用户已存在"})

        # 创建新用户
        profile = await memory_engine.initialize_user(user_id, profile_data)
        if profile:
            return {"success": True, "message": "用户档案创建成功", "profile": profile}
        else:
            return JSONResponse(status_code=500, content={"error": "创建用户失败"})
    except Exception as e:
        logger.error(f"创建用户档案失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"创建失败: {str(e)}"})

@app.get("/memory/user/{user_id}/context")
async def get_user_context(user_id: str, query: str = ""):
    """获取用户记忆上下文"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    try:
        context = await memory_engine.get_user_context(user_id, query)
        return {"success": True, "context": context}
    except Exception as e:
        logger.error(f"获取用户上下文失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"获取失败: {str(e)}"})

@app.get("/memory/user/{user_id}/short_term")
async def get_user_short_term_memory(user_id: str, limit: int = 10):
    """获取用户短期记忆"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    try:
        context = await memory_engine.short_term_memory.get_context(user_id, limit)
        return {"success": True, "short_term_memory": context}
    except Exception as e:
        logger.error(f"获取短期记忆失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"获取失败: {str(e)}"})

@app.delete("/memory/user/{user_id}/short_term")
async def clear_user_short_term_memory(user_id: str):
    """清除用户短期记忆"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    try:
        success = await memory_engine.short_term_memory.clear_context(user_id)
        if success:
            return {"success": True, "message": "短期记忆清除成功"}
        else:
            return JSONResponse(status_code=404, content={"error": "用户记忆不存在"})
    except Exception as e:
        logger.error(f"清除短期记忆失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"清除失败: {str(e)}"})

@app.get("/memory/user/{user_id}/long_term")
async def get_user_long_term_memories(user_id: str, limit: int = 50):
    """获取用户长期记忆"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    try:
        memories = await memory_engine.long_term_memory.get_user_memories(user_id, limit)
        return {"success": True, "long_term_memories": memories}
    except Exception as e:
        logger.error(f"获取长期记忆失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"获取失败: {str(e)}"})

@app.post("/memory/user/{user_id}/search")
async def search_user_memories(user_id: str, query: str = Form(...), limit: int = Form(5), threshold: float = Form(0.1)):
    """搜索用户相关记忆"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    try:
        memories = await memory_engine.long_term_memory.search_relevant_memories(user_id, query, limit, threshold)
        return {"success": True, "query": query, "memories": memories}
    except Exception as e:
        logger.error(f"搜索记忆失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"搜索失败: {str(e)}"})

@app.delete("/memory/{memory_id}")
async def delete_memory(memory_id: str):
    """删除指定记忆"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    try:
        success = await memory_engine.long_term_memory.delete_memory(memory_id)
        if success:
            return {"success": True, "message": "记忆删除成功"}
        else:
            return JSONResponse(status_code=404, content={"error": "记忆不存在"})
    except Exception as e:
        logger.error(f"删除记忆失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"删除失败: {str(e)}"})

@app.post("/test/embedding")
async def test_embedding(request: dict):
    """测试embedding功能"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    text = request.get("text", "")
    if not text:
        return JSONResponse(status_code=400, content={"error": "文本不能为空"})

    try:
        # 直接测试embedding引擎
        embedding = await memory_engine.embedding_engine.embed_text(text)
        if embedding is not None:
            return {
                "success": True,
                "text": text,
                "embedding": embedding.tolist() if hasattr(embedding, 'tolist') else embedding,
                "dimension": len(embedding) if embedding is not None else 0
            }
        else:
            return JSONResponse(status_code=500, content={"error": "嵌入向量生成失败"})
    except Exception as e:
        logger.error(f"测试embedding失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"测试失败: {str(e)}"})

@app.delete("/memory/user/{user_id}")
async def delete_user_completely(user_id: str):
    """完全删除用户及其所有数据"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    try:
        # 检查用户是否存在
        user_profile = await memory_engine.user_profile_store.get_profile(user_id)
        if not user_profile:
            return JSONResponse(status_code=404, content={"error": "用户不存在"})

        user_name = user_profile.get("name", "未知用户")

        # 删除用户的所有数据
        results = []

        # 1. 删除短期记忆
        try:
            await memory_engine.short_term_memory.clear_context(user_id)
            results.append("短期记忆已清除")
        except Exception as e:
            results.append(f"短期记忆清除失败: {str(e)}")

        # 2. 删除长期记忆
        try:
            user_memories = await memory_engine.long_term_memory.get_user_memories(user_id)
            for memory in user_memories:
                await memory_engine.long_term_memory.delete_memory(memory.get("id"))
            results.append(f"已删除 {len(user_memories)} 条长期记忆")
        except Exception as e:
            results.append(f"长期记忆删除失败: {str(e)}")

        # 3. 删除用户档案
        try:
            success = await memory_engine.user_profile_store.delete_profile(user_id)
            if success:
                results.append("用户档案已删除")
            else:
                results.append("用户档案删除失败")
        except Exception as e:
            results.append(f"用户档案删除失败: {str(e)}")

        logger.info(f"用户 {user_id} ({user_name}) 已被完全删除")

        return {
            "success": True,
            "message": f"用户 {user_name} 已被完全删除",
            "details": results
        }

    except Exception as e:
        logger.error(f"删除用户失败 user_id={user_id}: {e}")
        return JSONResponse(status_code=500, content={"error": f"删除用户失败: {str(e)}"})

@app.get("/memory/users/active")
async def get_active_users(hours: int = 24):
    """获取活跃用户列表"""
    global memory_engine
    if memory_engine is None:
        return JSONResponse(status_code=500, content={"error": "记忆引擎未初始化"})

    try:
        users = await memory_engine.user_profile_store.list_active_users(hours)
        return {"success": True, "active_users": users, "hours": hours}
    except Exception as e:
        logger.error(f"获取活跃用户失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"获取失败: {str(e)}"})

@app.post("/tts/synthesize")
async def synthesize_speech(request: dict):
    """文本转语音API"""
    global tts_client
    if tts_client is None:
        return JSONResponse(status_code=500, content={"error": "TTS客户端未初始化"})

    text = request.get("text", "")
    user_id = request.get("user_id", "default")

    if not text:
        return JSONResponse(status_code=400, content={"error": "文本不能为空"})

    try:
        # 收集音频数据
        audio_chunks = []
        async for chunk in tts_client.text_to_speech(text, user_id):
            audio_chunks.append(chunk)

        if audio_chunks:
            # 合并音频数据
            audio_data = b''.join(audio_chunks)
            import base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')

            return {
                "success": True,
                "audio_data": audio_base64,
                "format": "mp3",
                "text": text
            }
        else:
            return JSONResponse(status_code=500, content={"error": "TTS合成失败，未收到音频数据"})

    except Exception as e:
        logger.error(f"TTS合成失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"TTS合成失败: {str(e)}"})

@app.get("/tts/test")
async def test_tts():
    """测试TTS连接"""
    global tts_client
    if tts_client is None:
        return JSONResponse(status_code=500, content={"error": "TTS客户端未初始化"})

    try:
        result = await tts_client.test_connection()
        return {
            "success": result,
            "message": "TTS连接测试成功" if result else "TTS连接测试失败",
            "config": {
                "app_id": tts_client.app_id,
                "voice_type": tts_client.voice_type,
                "resource_id": tts_client.resource_id
            }
        }
    except Exception as e:
        logger.error(f"TTS测试失败: {e}")
        return JSONResponse(status_code=500, content={"error": f"TTS测试失败: {str(e)}"})

# ASR处理函数
active_asr_sessions = {}  # 存储活跃的ASR会话

async def handle_start_asr(websocket: WebSocket, user_id: str):
    """处理开始ASR识别"""
    global asr_client, active_asr_sessions

    try:
        logger.info(f"开始ASR识别: {user_id}")

        # 如果已有活跃会话，先停止
        if user_id in active_asr_sessions:
            await handle_stop_asr(websocket, user_id)

        # 创建音频队列
        audio_queue = asyncio.Queue()
        active_asr_sessions[user_id] = {
            'audio_queue': audio_queue,
            'is_active': True
        }

        # 发送开始确认
        await websocket.send_text(json.dumps({
            "type": "asr_started",
            "message": "语音识别已开始"
        }))

        # 启动ASR识别任务
        asyncio.create_task(process_asr_stream(websocket, user_id, audio_queue))

    except Exception as e:
        logger.error(f"开始ASR识别失败: {e}")
        await websocket.send_text(json.dumps({
            "type": "asr_error",
            "error": f"开始识别失败: {str(e)}"
        }))

async def handle_audio_chunk(websocket: WebSocket, user_id: str, audio_data: str):
    """处理音频数据块"""
    try:
        if user_id not in active_asr_sessions:
            logger.warning(f"ASR会话未找到，尝试自动重启: {user_id}")
            # 尝试自动重启ASR会话
            await handle_start_asr(websocket, user_id)
            # 给会话启动一点时间
            await asyncio.sleep(0.1)

            # 再次检查会话是否存在
            if user_id not in active_asr_sessions:
                await websocket.send_text(json.dumps({
                    "type": "asr_error",
                    "error": "ASR会话未激活，自动重启失败"
                }))
                return

        # 解码base64音频数据
        import base64
        try:
            audio_bytes = base64.b64decode(audio_data)
        except Exception as decode_error:
            logger.error(f"音频数据解码失败: {decode_error}")
            await websocket.send_text(json.dumps({
                "type": "asr_error",
                "error": f"音频数据格式错误: {str(decode_error)}"
            }))
            return

        # 添加到音频队列
        session = active_asr_sessions[user_id]
        if session.get('is_active', False):
            try:
                await session['audio_queue'].put(audio_bytes)
                logger.debug(f"收到音频数据: {user_id}, 大小: {len(audio_bytes)} bytes")
            except Exception as queue_error:
                logger.error(f"音频队列操作失败: {queue_error}")
                await websocket.send_text(json.dumps({
                    "type": "asr_error",
                    "error": f"音频队列错误: {str(queue_error)}"
                }))
        else:
            logger.warning(f"ASR会话已停用: {user_id}")

    except Exception as e:
        logger.error(f"处理音频数据失败: {e}")
        try:
            await websocket.send_text(json.dumps({
                "type": "asr_error",
                "error": f"音频处理失败: {str(e)}"
            }))
        except Exception as send_error:
            logger.error(f"发送错误消息失败: {send_error}")

async def handle_stop_asr(websocket: WebSocket, user_id: str):
    """处理停止ASR识别"""
    try:
        logger.info(f"停止ASR识别: {user_id}")

        if user_id in active_asr_sessions:
            session = active_asr_sessions[user_id]
            session['is_active'] = False

            # 发送结束信号到音频队列
            await session['audio_queue'].put(None)

            # 移除会话
            del active_asr_sessions[user_id]

        # 发送停止确认
        await websocket.send_text(json.dumps({
            "type": "asr_stopped",
            "message": "语音识别已停止"
        }))

    except Exception as e:
        logger.error(f"停止ASR识别失败: {e}")
        await websocket.send_text(json.dumps({
            "type": "asr_error",
            "error": f"停止识别失败: {str(e)}"
        }))

async def process_asr_stream(websocket: WebSocket, user_id: str, audio_queue: asyncio.Queue):
    """处理ASR音频流识别"""
    try:
        logger.info(f"开始处理ASR音频流: {user_id}")

        # 创建音频流生成器
        async def audio_stream_generator():
            while True:
                audio_chunk = await audio_queue.get()
                if audio_chunk is None:  # 结束信号
                    break
                yield audio_chunk

        # 获取用户选择的ASR客户端
        current_asr_client = get_user_asr_client(user_id)
        asr_choice = user_asr_choice.get(user_id, "xfyun")

        # 启动ASR识别
        if asr_choice == "doubao":
            # 豆包ASR使用不同的处理方式
            await process_doubao_asr_stream(websocket, user_id, audio_queue, current_asr_client)
        else:
            # 讯飞ASR使用原来的方式
            async for result in current_asr_client.speech_to_text(audio_stream_generator()):
                if 'error' in result:
                    await websocket.send_text(json.dumps({
                        "type": "asr_error",
                        "error": result['error']
                    }))
                    break

                # 处理所有ASR结果，包括空结果（用于调试）
                if 'text' in result:
                    text_content = result['text']
                    is_final = result.get('is_final', False)

                    # 发送识别结果（即使是空的也发送，用于调试）
                    await websocket.send_text(json.dumps({
                        "type": "asr_result",
                        "text": text_content,
                        "is_final": is_final,
                        "confidence": result.get('confidence', 'normal')
                    }))

                    if text_content:
                        logger.info(f"✅ ASR识别结果: {user_id} - '{text_content}' (final: {is_final})")

                        # 禁用ASR结果的自动对话触发
                        # 现在所有ASR结果都不会自动触发对话
                        # 只有用户主动发送消息时才会触发对话
                        logger.debug(f"ASR识别结果不再自动触发对话: {user_id} - '{text_content}' (final: {is_final})")
                    else:
                        logger.debug(f"🔍 ASR空识别结果: {user_id} (final: {is_final})")
                else:
                    logger.debug(f"🔍 ASR结果无文本字段: {user_id} - {result}")

        logger.info(f"ASR音频流处理完成: {user_id}")

    except Exception as e:
        logger.error(f"ASR音频流处理错误: {e}")
        try:
            await websocket.send_text(json.dumps({
                "type": "asr_error",
                "error": f"音频流处理失败: {str(e)}"
            }))
        except Exception as send_error:
            logger.error(f"发送ASR错误消息失败: {send_error}")
    finally:
        # 清理会话
        try:
            if user_id in active_asr_sessions:
                active_asr_sessions[user_id]['is_active'] = False
                del active_asr_sessions[user_id]
                logger.debug(f"ASR会话已清理: {user_id}")
        except Exception as cleanup_error:
            logger.error(f"清理ASR会话失败: {cleanup_error}")

async def process_doubao_asr_stream(websocket: WebSocket, user_id: str, audio_queue: asyncio.Queue, doubao_client):
    """处理豆包ASR音频流识别"""
    try:
        logger.info(f"开始处理豆包ASR音频流: {user_id}")

        # 定义回调函数处理识别结果
        async def asr_callback(text: str, is_final: bool, confidence: float):
            try:
                # 发送识别结果
                await websocket.send_text(json.dumps({
                    "type": "asr_result",
                    "text": text,
                    "is_final": is_final,
                    "confidence": confidence
                }))

                if text:
                    logger.info(f"✅ 豆包ASR识别结果: {user_id} - '{text}' (final: {is_final})")

                    # 禁用ASR结果的自动对话触发
                    logger.debug(f"豆包ASR识别结果不再自动触发对话: {user_id} - '{text}' (final: {is_final})")
                else:
                    logger.debug(f"🔍 豆包ASR空识别结果: {user_id} (final: {is_final})")

            except Exception as e:
                logger.error(f"豆包ASR回调处理错误: {e}")

        # 启动豆包ASR识别任务
        recognition_task = asyncio.create_task(
            doubao_client.start_recognition(user_id, asr_callback)
        )

        # 处理音频队列
        try:
            while True:
                audio_chunk = await audio_queue.get()
                if audio_chunk is None:  # 结束信号
                    logger.info(f"收到结束信号，停止豆包ASR: {user_id}")
                    # 发送最后一包音频（标记为final）
                    await doubao_client.send_audio(b'', is_final=True)
                    break

                # 发送音频数据到豆包ASR
                success = await doubao_client.send_audio(audio_chunk, is_final=False)
                if not success:
                    logger.error(f"豆包ASR发送音频失败: {user_id}")
                    break

                logger.debug(f"豆包ASR收到音频数据: {user_id}, 大小: {len(audio_chunk)} bytes")

        except Exception as e:
            logger.error(f"豆包ASR音频队列处理错误: {e}")
        finally:
            # 取消识别任务
            if not recognition_task.done():
                recognition_task.cancel()
            await doubao_client.disconnect()

    except Exception as e:
        logger.error(f"豆包ASR音频流处理错误: {e}")
        try:
            await websocket.send_text(json.dumps({
                "type": "asr_error",
                "error": f"豆包ASR处理失败: {str(e)}"
            }))
        except Exception as send_error:
            logger.error(f"发送豆包ASR错误消息失败: {send_error}")

# ========== 用户会话管理API ==========

@app.get("/api/user/{user_id}/session")
async def validate_user_session(user_id: str):
    """验证用户会话并返回最新档案信息"""
    global memory_engine

    if not memory_engine:
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": "Memory engine not available"}
        )

    try:
        logger.info(f"验证用户会话: {user_id}")

        # 获取用户档案
        profile = await memory_engine.user_profile_store.get_profile(user_id)

        if profile:
            # 更新最后活跃时间
            await memory_engine.user_profile_store.update_last_active(user_id)

            # 获取用户的短期记忆统计
            try:
                turn_count = await memory_engine.short_term_memory.get_conversation_turn_count(user_id)
            except:
                turn_count = 0

            # 构建完整的用户信息
            user_info = {
                "user_id": user_id,
                "name": profile.get("name", "用户"),
                "age": profile.get("age"),
                "gender": profile.get("gender"),
                "style": profile.get("style", "友好"),
                "interests": profile.get("interests", []),
                "created_at": profile.get("created_at"),
                "last_active": profile.get("last_active"),
                "conversation_turns": turn_count
            }

            logger.info(f"会话验证成功: {user_id}, 对话轮数: {turn_count}")

            return JSONResponse(content={
                "success": True,
                "profile": user_info,
                "timestamp": datetime.now().isoformat(),
                "message": "会话验证成功"
            })
        else:
            logger.warning(f"用户不存在: {user_id}")
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "用户不存在"}
            )

    except Exception as e:
        logger.error(f"会话验证失败 user_id={user_id}: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"验证失败: {str(e)}"}
        )

@app.post("/api/user/{user_id}/sync")
async def sync_user_data(user_id: str):
    """同步用户数据（可扩展用于推送本地更改到服务器）"""
    global memory_engine

    if not memory_engine:
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": "Memory engine not available"}
        )

    try:
        logger.info(f"同步用户数据: {user_id}")

        # 获取最新的用户档案
        profile = await memory_engine.user_profile_store.get_profile(user_id)

        if profile:
            # 更新最后活跃时间
            await memory_engine.user_profile_store.update_last_active(user_id)

            # 这里可以添加更多同步逻辑，比如：
            # - 同步用户的偏好设置
            # - 同步聊天历史
            # - 同步用户状态等

            return JSONResponse(content={
                "success": True,
                "profile": profile,
                "synced_at": datetime.now().isoformat(),
                "message": "数据同步成功"
            })
        else:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "用户不存在"}
            )

    except Exception as e:
        logger.error(f"数据同步失败 user_id={user_id}: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"同步失败: {str(e)}"}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
