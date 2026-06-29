import asyncio
import json
import os
import unittest

import websockets

from gateway.gateway import Gateway

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
TEST_TOKEN = "test-token"
TEST_PORT = 18765


class GatewayTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.gateway = Gateway(command="python3 mock_engine.py", cwd=FIXTURES_DIR, token=TEST_TOKEN)
        self.run_task = asyncio.create_task(self.gateway.run("127.0.0.1", TEST_PORT))
        await asyncio.sleep(0.3)  # let the listener and mock engine subprocess come up

    async def asyncTearDown(self):
        await self.gateway.stop()
        self.run_task.cancel()
        try:
            await self.run_task
        except asyncio.CancelledError:
            pass

    async def _connect_authed(self):
        ws = await websockets.connect(f"ws://127.0.0.1:{TEST_PORT}")
        await ws.send(json.dumps({"type": "auth", "token": TEST_TOKEN}))
        reply = json.loads(await ws.recv())
        self.assertEqual(reply.get("type"), "auth_ok")
        status_msg = json.loads(await ws.recv())  # initial gateway:engineUp/Down
        self.assertIn(status_msg.get("event"), ("gateway:engineUp", "gateway:engineDown"))
        return ws

    async def test_rejects_bad_token(self):
        ws = await websockets.connect(f"ws://127.0.0.1:{TEST_PORT}")
        await ws.send(json.dumps({"type": "auth", "token": "wrong"}))
        with self.assertRaises(websockets.ConnectionClosed):
            await ws.recv()

    async def test_ping_roundtrip(self):
        ws = await self._connect_authed()
        await ws.send(json.dumps({"id": 1, "method": "ping"}))
        reply = json.loads(await ws.recv())
        self.assertEqual(reply["id"], 1)
        self.assertEqual(reply["result"], "pong")
        await ws.close()

    async def test_event_broadcast_to_multiple_clients(self):
        ws_a = await self._connect_authed()
        ws_b = await self._connect_authed()
        await ws_a.send(json.dumps({"id": 7, "method": "emitEvent", "params": {"foo": "bar"}}))

        seen_event, seen_result = None, None
        for _ in range(2):
            msg = json.loads(await ws_a.recv())
            if "event" in msg:
                seen_event = msg
            else:
                seen_result = msg
        self.assertEqual(seen_event["event"], "signal:new")
        self.assertEqual(seen_result["id"], 7)

        msg_b = json.loads(await ws_b.recv())
        self.assertEqual(msg_b["event"], "signal:new")

        await ws_a.close()
        await ws_b.close()

    async def test_error_response_passthrough(self):
        ws = await self._connect_authed()
        await ws.send(json.dumps({"id": 9, "method": "boom"}))
        reply = json.loads(await ws.recv())
        self.assertEqual(reply["id"], 9)
        self.assertIn("error", reply)
        await ws.close()


if __name__ == "__main__":
    unittest.main()
